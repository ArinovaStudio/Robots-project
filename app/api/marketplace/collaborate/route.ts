import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    if (user.accountType === "INVESTOR") {
      return NextResponse.json(
        { success: false, message: "Investors cannot send B2B service collaboration requests." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      recipientId,
      expectations,
      offerings,
      contributionDesc,
      resourcesAvailable,
      expertiseCapabilities,
      existingAssets,
      overview,
    } = body;

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

    const collabId = crypto.randomUUID();

    await prisma.$executeRawUnsafe(
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

    // Send notification to recipient
    const senderName = user.name || "A business partner";
    await prisma.notification.create({
      data: {
        userId: recipientId,
        actorId: user.id,
        type: "SYSTEM",
        content: `${senderName} submitted a B2B collaboration proposal to your business.`,
        link: "/collaboration-requests?tab=business",
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
  } catch (error) {
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
    const recipientId = body?.recipientId;
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

    await prisma.$executeRaw`
      DELETE FROM "MarketplaceCollaboration"
      WHERE "requesterId" = ${user.id}
        AND "recipientId" = ${recipientId}
        AND "status" = 'PENDING'
    `;

    // Best effort: remove the "submitted a proposal" notification we sent them
    const earliest = pending.reduce((min, r) => (r.createdAt < min ? r.createdAt : min), pending[0].createdAt);
    await prisma.notification
      .deleteMany({
        where: {
          userId: recipientId,
          actorId: user.id,
          type: "SYSTEM",
          content: { endsWith: "submitted a B2B collaboration proposal to your business." },
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
 *  - received: proposals other businesses sent to me
 *  - sent: proposals I sent to other businesses
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

    const where = direction === "sent" ? { requesterId: user.id } : { recipientId: user.id };

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

    return NextResponse.json({
      success: true,
      data,
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
      await prisma.follow
        .createMany({
          data: [
            { followerId: user.id, followingId: collab.requesterId },
            { followerId: collab.requesterId, followingId: user.id },
          ],
          skipDuplicates: true,
        })
        .catch(() => {});
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