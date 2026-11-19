import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { autoConnectUsers } from "@/lib/auto-connect";
import { prisma } from "@/lib/prisma";
import { checkRequestQuota, recordRequestAttempt, quotaMessage } from "@/lib/request-quota";

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const isMultipart = req.headers.get("content-type")?.includes("multipart/form-data");
    let recipientId = "";
    let expectations: string[] = [];
    let offerings: string[] = [];
    let contributionDesc: string | null = null;
    let resourcesAvailable: string | null = null;
    let expertiseCapabilities: string | null = null;
    let existingAssets: string | null = null;
    let overview = "";

    if (isMultipart) {
      const formData = await req.formData();
      recipientId = formData.get("recipientId")?.toString().trim() ?? "";
      const collaborationType = formData.get("collaborationType")?.toString().trim() ?? "";
      const targetOpportunity = formData.get("targetOpportunity")?.toString().trim() ?? "";
      const proposedInvestment = formData.get("proposedInvestment")?.toString().trim() ?? "";
      const yourParticipation = formData.get("yourParticipation")?.toString().trim() ?? "";
      const message = formData.get("message")?.toString().trim() ?? "";

      expectations = collaborationType ? [collaborationType] : ["Capital investment"];
      offerings = [
        proposedInvestment ? `Proposed Investment: ${proposedInvestment}` : null,
        yourParticipation ? `Participation: ${yourParticipation}` : null,
      ].filter(Boolean) as string[];
      contributionDesc = targetOpportunity || null;
      overview = message;

      const fileEntry = formData.get("document");
      if (fileEntry && typeof fileEntry !== "string" && (fileEntry as File).size > 0) {
        try {
          const { uploadFile } = await import("@/lib/uploads");
          resourcesAvailable = await uploadFile(fileEntry as File, "collaborations");
        } catch (uploadErr) {
          console.error("Document upload failed:", uploadErr);
        }
      }
    } else {
      if (user.accountType === "INVESTOR") {
        return NextResponse.json(
          { success: false, message: "Investors cannot send B2B service collaboration requests." },
          { status: 403 }
        );
      }

      const body = await req.json();
      recipientId = body.recipientId;
      expectations = body.expectations;
      offerings = body.offerings;
      contributionDesc = body.contributionDesc;
      resourcesAvailable = body.resourcesAvailable;
      expertiseCapabilities = body.expertiseCapabilities;
      existingAssets = body.existingAssets;
      overview = body.overview;
    }

    if (!recipientId || typeof recipientId !== "string") {
      return NextResponse.json(
        { success: false, message: "Recipient business ID is required." },
        { status: 400 }
      );
    }

    if (recipientId === user.id) {
      return NextResponse.json(
        { success: false, message: "You cannot send a collaboration proposal to your own business." },
        { status: 400 }
      );
    }

    if (!Array.isArray(expectations) || expectations.length === 0) {
      return NextResponse.json(
        { success: false, message: "Please select at least one collaboration expectation." },
        { status: 400 }
      );
    }

    if (!Array.isArray(offerings) || offerings.length === 0) {
      return NextResponse.json(
        { success: false, message: "Please select at least one thing your business can offer." },
        { status: 400 }
      );
    }

    if (!overview || typeof overview !== "string" || overview.trim().length < 10) {
      return NextResponse.json(
        { success: false, message: "Please provide a detailed collaboration overview (at least 10 characters)." },
        { status: 400 }
      );
    }

    // Check that recipient exists and is active
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      include: { company: true },
    });

    if (!recipient || recipient.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, message: "Recipient business not found or inactive." },
        { status: 404 }
      );
    }

    // Check for duplicate pending collaboration request to prevent spam
    const existingPending = await prisma.$queryRaw<any[]>`
      SELECT id FROM "MarketplaceCollaboration"
      WHERE "requesterId" = ${user.id}
        AND "recipientId" = ${recipientId}
        AND "status" = 'PENDING'
      LIMIT 1
    `;

    if (existingPending.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "You already have a pending collaboration request with this business.",
        },
        { status: 409 }
      );
    }

    const quota = await checkRequestQuota("MARKETPLACE_COLLABORATION", user.id, recipientId);
    if (quota.blocked) {
      return NextResponse.json(
        {
          success: false,
          message: quotaMessage("collaboration request", recipient.accountType === "INVESTOR" ? "investor" : "business", quota),
          retryAt: quota.retryAt,
        },
        { status: 429 }
      );
    }

    const collabId = crypto.randomUUID();

    await prisma.$transaction(async (tx) => {
      // Re-check inside the transaction so two simultaneous sends can't both slip past the limit.
      const raceQuota = await checkRequestQuota("MARKETPLACE_COLLABORATION", user.id, recipientId, tx);
      if (raceQuota.blocked) throw new Error("COLLAB_QUOTA_EXCEEDED");
      await tx.$executeRawUnsafe(
      `INSERT INTO "MarketplaceCollaboration" (
        "id", "requesterId", "recipientId", "expectations", "offerings",
        "contributionDesc", "resourcesAvailable", "expertiseCapabilities", "existingAssets",
        "overview", "status", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', NOW(), NOW())`,
      collabId,
      user.id,
      recipientId,
      expectations.map((e) => String(e).trim()),
      offerings.map((o) => String(o).trim()),
      contributionDesc ? String(contributionDesc).trim() : null,
      resourcesAvailable ? String(resourcesAvailable).trim() : null,
      expertiseCapabilities ? String(expertiseCapabilities).trim() : null,
      existingAssets ? String(existingAssets).trim() : null,
      overview.trim()
      );
      await recordRequestAttempt(tx, "MARKETPLACE_COLLABORATION", user.id, recipientId, collabId);
    });

    // Send notification to recipient
    const senderName = user.name || (user.accountType === "INVESTOR" ? "An investor" : "A business partner");
    await prisma.notification.create({
      data: {
        userId: recipientId,
        actorId: user.id,
        type: "SYSTEM",
        content: `${senderName} submitted a collaboration proposal to your business.`,
        // An investor's proposal belongs on the recipient's Investor tab, a business's on the Business tab.
        link: `/collaboration-requests?tab=${user.accountType === "INVESTOR" ? "investor" : "business"}`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Collaboration request sent successfully!",
        data: { id: collabId },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error?.message === "COLLAB_QUOTA_EXCEEDED") {
      return NextResponse.json(
        { success: false, message: "You have reached the request limit for this recipient. Please try again later." },
        { status: 429 }
      );
    }
    console.error("Collaborate submission error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit collaboration request." },
      { status: 500 }
    );
  }
}

/**
 * Cancel a collaboration request you sent that is still pending.
 * Body: { recipientId: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    let recipientId = body?.recipientId;
    const idParam = req.nextUrl.searchParams.get("id");
    if ((!recipientId || typeof recipientId !== "string") && idParam) {
      // Cancel by request id: resolve the recipient from my own pending request.
      const row = await prisma.marketplaceCollaboration.findFirst({
        where: { id: idParam, requesterId: user.id, status: "PENDING" },
        select: { recipientId: true },
      });
      recipientId = row?.recipientId;
      if (!recipientId) {
        return NextResponse.json({ success: false, message: "No pending collaboration request found." }, { status: 404 });
      }
    }
    if (!recipientId || typeof recipientId !== "string") {
      return NextResponse.json({ success: false, message: "Recipient business ID is required." }, { status: 400 });
    }

    // Only the sender can cancel, and only while it is still pending
    const pending = await prisma.$queryRaw<{ id: string; createdAt: Date }[]>`
      SELECT "id", "createdAt" FROM "MarketplaceCollaboration"
      WHERE "requesterId" = ${user.id}
        AND "recipientId" = ${recipientId}
        AND "status" = 'PENDING'
    `;

    if (pending.length === 0) {
      return NextResponse.json(
        { success: false, message: "No pending collaboration request found for this business." },
        { status: 404 }
      );
    }

    // Withdrawing a request nobody has answered yet gives the attempt back.
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        DELETE FROM "MarketplaceCollaboration"
        WHERE "requesterId" = ${user.id}
          AND "recipientId" = ${recipientId}
          AND "status" = 'PENDING'
      `;
      await tx.requestAttempt.deleteMany({
        where: { kind: "MARKETPLACE_COLLABORATION", requestId: { in: pending.map((r) => r.id) } },
      });
    });

    // Best effort: remove the "submitted a proposal" notification we sent them
    const earliest = pending.reduce((min, r) => (r.createdAt < min ? r.createdAt : min), pending[0].createdAt);
    await prisma.notification
      .deleteMany({
        where: {
          userId: recipientId,
          actorId: user.id,
          type: "SYSTEM",
          content: { endsWith: "submitted a collaboration proposal to your business." },
          createdAt: { gte: new Date(new Date(earliest).getTime() - 5000) },
        },
      })
      .catch(() => null);

    return NextResponse.json({ success: true, message: "Collaboration request cancelled." });
  } catch (error) {
    console.error("Collaborate cancel error:", error);
    return NextResponse.json({ success: false, message: "Failed to cancel collaboration request." }, { status: 500 });
  }
}

const partySelect = {
  id: true,
  name: true,
  image: true,
  verificationStatus: true,
  accountType: true,
  investor: { select: { firmName: true, investorType: true, city: true, country: true } },
  company: {
    select: {
      companyName: true,
      logoUrl: true,
      type: true,
      location: true,
    },
  },
} as const;

/**
 * List collaboration requests.
 * Query: ?direction=received (default) | sent   &page=1 &limit=50 (max 100)
 *        &counterparty=business | investor  (optional)
 *  - received: proposals other accounts sent to me
 *  - sent: proposals I sent to other accounts
 *  - counterparty narrows to the OTHER side: "investor" = only investors, "business" = everyone
 *    who is not an investor. Omit it to get both.
 */
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const direction = searchParams.get("direction") === "sent" ? "sent" : "received";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50));

    const counterparty = searchParams.get("counterparty");
    const otherSide =
      counterparty === "investor"
        ? { accountType: "INVESTOR" as const }
        : counterparty === "business"
        ? { accountType: { not: "INVESTOR" as const } }
        : null;

    const where =
      direction === "sent"
        ? { requesterId: user.id, ...(otherSide ? { recipient: otherSide } : {}) }
        : { recipientId: user.id, ...(otherSide ? { requester: otherSide } : {}) };

    const [data, total] = await Promise.all([
      prisma.marketplaceCollaboration.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          requester: { select: partySelect },
          recipient: { select: partySelect },
        },
      }),
      prisma.marketplaceCollaboration.count({ where }),
    ]);

        // Flag rows whose counterparty is an accepted connection, so the UI only offers
    // messaging to non-connections once the request has been accepted.
    const partnerIds = Array.from(new Set(data.map((c) => (direction === "sent" ? c.recipientId : c.requesterId))));
    const connections = partnerIds.length
      ? await prisma.connection.findMany({
          where: {
            status: "ACCEPTED",
            OR: [
              { senderId: user.id, receiverId: { in: partnerIds } },
              { receiverId: user.id, senderId: { in: partnerIds } },
            ],
          },
          select: { senderId: true, receiverId: true },
        })
      : [];
    const connectedIds = new Set(connections.map((c) => (c.senderId === user.id ? c.receiverId : c.senderId)));
    const rows = data.map((c) => ({
      ...c,
      isConnected: connectedIds.has(direction === "sent" ? c.recipientId : c.requesterId),
    }));

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Collaborate list error:", error);
    return NextResponse.json({ success: false, message: "Failed to load collaboration requests." }, { status: 500 });
  }
}

/**
 * Respond to a collaboration request I received.
 * Body: { id: string, status: "ACCEPTED" | "DECLINED" | "INFO_REQUESTED" }
 * Only the recipient can respond. Once ACCEPTED or DECLINED the decision is final.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { id, status } = body as { id?: unknown; status?: unknown };

    if (typeof id !== "string" || !id || typeof status !== "string" || !["ACCEPTED", "DECLINED", "INFO_REQUESTED"].includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
    }

    const collab = await prisma.marketplaceCollaboration.findFirst({
      where: { id, recipientId: user.id },
    });

    if (!collab) {
      return NextResponse.json({ success: false, message: "Collaboration request not found." }, { status: 404 });
    }

    if (collab.status === "ACCEPTED" || collab.status === "DECLINED") {
      return NextResponse.json(
        { success: false, message: `This request was already ${collab.status.toLowerCase()}.` },
        { status: 409 }
      );
    }

    if (collab.status === status) {
      return NextResponse.json({ success: true, data: collab });
    }

    const updated = await prisma.marketplaceCollaboration.update({
      where: { id },
      data: { status },
    });

    if (status === "ACCEPTED") {
      await autoConnectUsers(user.id, collab.requesterId);
    }

    // Best effort: tell the business that sent the proposal
    const responderName = user.name || "A business";
    const notice =
      status === "ACCEPTED"
        ? { content: `${responderName} accepted your B2B collaboration proposal.`, link: `/profile/${user.id}` }
        : status === "DECLINED"
        ? { content: `${responderName} declined your B2B collaboration proposal.`, link: `/profile/${user.id}` }
        : { content: `${responderName} asked for more information about your B2B collaboration proposal.`, link: `/messages/${user.id}` };

    await prisma.notification
      .create({
        data: { userId: collab.requesterId, actorId: user.id, type: "SYSTEM", ...notice },
      })
      .catch((e) => console.error("Failed to notify requester of collaboration response:", e));

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Collaborate respond error:", error);
    return NextResponse.json({ success: false, message: "Failed to update collaboration request." }, { status: 500 });
  }
}