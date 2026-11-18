import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/uploads";
import { formatTargetAmount } from "@/lib/utils";
import { autoConnectUsers } from "@/lib/auto-connect";
import { COLLABORATION_DOCUMENTS, COLLABORATION_TYPES, DEAL_STAGES } from "@/lib/investor-options";

const LIMITS = { targetCompany: 120, proposedAmount: 60, participation: 60, message: 1000 } as const;
const inFlight = new Set<string>();

const fail = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status });

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) return fail(error || "Unauthorized", 401);
    if (user.accountType !== "INVESTOR") return fail("Only investor accounts can send investor collaboration requests.", 403);
    if (!req.headers.get("content-type")?.includes("multipart/form-data")) return fail("Invalid request.");

    const formData = await req.formData();
    const get = (key: string) => formData.get(key)?.toString().trim() ?? "";

    const collaboratorId = get("collaboratorId");
    const collaborationType = get("collaborationType");
    const dealStage = get("dealStage");
    const targetCompany = get("targetCompany");
    const proposedAmount = get("proposedAmount");
    const participation = get("participation");
    const message = get("message");

    // All text fields are mandatory; documents are optional.
    const missing: string[] = [];
    if (!collaboratorId) missing.push("collaborating investor");
    if (!collaborationType) missing.push("collaboration type");
    if (!dealStage) missing.push("deal stage");
    if (!targetCompany) missing.push("target company / investment opportunity");
    if (!proposedAmount) missing.push("proposed investment amount");
    if (!participation) missing.push("your participation");
    if (!message) missing.push("collaboration message");
    if (missing.length) return fail(`Please provide: ${missing.join(", ")}.`);

    if (!(COLLABORATION_TYPES as readonly string[]).includes(collaborationType)) return fail("Invalid collaboration type.");
    if (!(DEAL_STAGES as readonly string[]).includes(dealStage)) return fail("Invalid deal stage.");
    const values = { targetCompany, proposedAmount, participation, message };
    const tooLong = (Object.keys(LIMITS) as (keyof typeof LIMITS)[]).find((k) => values[k].length > LIMITS[k]);
    if (tooLong) return fail(`"${tooLong}" is too long (max ${LIMITS[tooLong]} characters).`);
    if (collaboratorId === user.id) return fail("You can't send a collaboration request to yourself.");

    const lockKey = `${user.id}:${collaboratorId}`;
    if (inFlight.has(lockKey)) return fail("A request to this investor is already in progress. Please wait.", 409);
    inFlight.add(lockKey);

    try {
      const collaborator = await prisma.user.findUnique({
        where: { id: collaboratorId },
        select: { id: true, accountType: true, status: true },
      });
      if (!collaborator || collaborator.accountType !== "INVESTOR" || collaborator.status !== "ACTIVE") {
        return fail("Investor not found.", 404);
      }

      const blocked = await prisma.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: user.id, blockedId: collaboratorId },
            { blockerId: collaboratorId, blockedId: user.id },
          ],
        },
        select: { id: true },
      });
      if (blocked) return fail("Investor not found.", 404);

      const pending = await prisma.investorCollaboration.findFirst({
        where: { requesterId: user.id, collaboratorId, status: "PENDING" },
        select: { id: true },
      });
      if (pending) return fail("You already have a pending collaboration request with this investor.", 409);

      // Validate and upload the optional documents
      const urls: Record<string, string | null> = {};
      for (const doc of COLLABORATION_DOCUMENTS) {
        const entry = formData.get(doc.key);
        if (!entry || typeof entry === "string" || entry.size === 0) {
          urls[doc.key] = null;
          continue;
        }
        const file = entry as File;
        const lower = file.name.toLowerCase();
        if (!(doc.exts as readonly string[]).some((ext) => lower.endsWith(ext))) {
          return fail(`${doc.label} must be one of: ${doc.exts.join(", ")}.`);
        }
        if (file.size > doc.maxMb * 1024 * 1024) return fail(`${doc.label} must be ${doc.maxMb} MB or smaller.`);
        if (lower.endsWith(".pdf")) {
          const sig = new TextDecoder().decode(new Uint8Array(await file.slice(0, 5).arrayBuffer()));
          if (sig !== "%PDF-") return fail(`${doc.label} is not a valid PDF.`);
        }
        urls[doc.key] = await uploadFile(file, "investor-collaborations");
      }

      const created = await prisma.investorCollaboration.create({
        data: {
          requesterId: user.id,
          collaboratorId,
          collaborationType,
          dealStage,
          targetCompany,
          proposedAmount: formatTargetAmount(proposedAmount) || proposedAmount,
          participation,
          message,
          pitchDeckUrl: urls.pitchDeck,
          businessPlanUrl: urls.businessPlan,
          financialsUrl: urls.financials,
          otherDocumentsUrl: urls.otherDocuments,
        },
        select: { id: true },
      });

      try {
        const requesterProfile = await prisma.investorProfile.findUnique({
          where: { userId: user.id },
          select: { firmName: true },
        });
        await prisma.notification.create({
          data: {
            userId: collaboratorId,
            actorId: user.id,
            type: "SYSTEM",
            content: `${requesterProfile?.firmName || user.name || "An investor"} sent you a ${collaborationType} collaboration request`,
            link: `/investors/requests?collaborationId=${created.id}`,
          },
        });
      } catch (notifyError) {
        console.error("Failed to notify investor of collaboration request:", notifyError);
      }

      return NextResponse.json({ success: true, message: "Collaboration request sent.", data: { id: created.id } }, { status: 201 });
    } finally {
      inFlight.delete(lockKey);
    }
  } catch (error) {
    console.error("Failed to create investor collaboration:", error);
    return fail("Internal server error", 500);
  }
}

const partySelect = {
  id: true,
  name: true,
  image: true,
  verificationStatus: true,
  investor: { select: { firmName: true, investorType: true, city: true, country: true } },
} as const;

// Lists investor collaboration requests the current investor has sent and received.
export async function GET() {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) return fail(error || "Unauthorized", 401);
    if (user.accountType !== "INVESTOR") return fail("Only investor accounts can view investor collaboration requests.", 403);

    const [sent, received] = await Promise.all([
      prisma.investorCollaboration.findMany({
        where: { requesterId: user.id },
        orderBy: { createdAt: "desc" },
        include: { collaborator: { select: partySelect } },
      }),
      prisma.investorCollaboration.findMany({
        where: { collaboratorId: user.id },
        orderBy: { createdAt: "desc" },
        include: { requester: { select: partySelect } },
      }),
    ]);

    return NextResponse.json({ success: true, data: { sent, received } });
  } catch (error) {
    console.error("Failed to fetch investor collaborations:", error);
    return fail("Internal server error", 500);
  }
}

// The receiving investor accepts, declines or asks for more info.
export async function PATCH(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) return fail(error || "Unauthorized", 401);

    const { id, status } = await req.json();
    if (!id || !["ACCEPTED", "DECLINED", "REVIEWED"].includes(status)) return fail("Invalid status");

    const collab = await prisma.investorCollaboration.findFirst({ where: { id, collaboratorId: user.id } });
    if (!collab) return fail("Collaboration request not found", 404);

    const updated = await prisma.investorCollaboration.update({ where: { id }, data: { status } });
    if (status === "ACCEPTED") await autoConnectUsers(user.id, collab.requesterId);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update investor collaboration:", error);
    return fail("Internal server error", 500);
  }
}

// Either party can remove the request.
export async function DELETE(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) return fail(error || "Unauthorized", 401);

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return fail("Missing id");

    const result = await prisma.investorCollaboration.deleteMany({
      where: { id, OR: [{ requesterId: user.id }, { collaboratorId: user.id }] },
    });
    if (!result.count) return fail("Collaboration request not found", 404);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete investor collaboration:", error);
    return fail("Internal server error", 500);
  }
}
