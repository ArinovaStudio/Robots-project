import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const [pendingRequests, totalCount] = await Promise.all([
      prisma.connection.findMany({
        where: { receiverId: user.id, status: "PENDING" },
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, name: true, image: true, company: true } }
        }
      }),
      prisma.connection.count({ where: { receiverId: user.id, status: "PENDING" } })
    ]);

    const formattedRequests = pendingRequests.map(req => ({
      connectionId: req.id,
      message: req.message,
      requestedAt: req.createdAt,
      companyName: req.sender.company?.companyName || req.sender.name || "Unknown User",
      logoUrl: req.sender.company?.logoUrl || null,
      type: req.sender.company?.type || "User",
      userId: req.sender.id,
    }));

    return NextResponse.json({
      success: true,
      data: formattedRequests,
      pagination: { total: totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) }
    });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json(
        { success: false, message: error || "Unauthorized" },
        { status: 401 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const pendingRequests = await tx.connection.findMany({
        where: { receiverId: user.id, status: "PENDING" },
        select: { senderId: true },
      });
      const pendingSenderIds = pendingRequests.map((request) => request.senderId);
      const existingNotifications = await tx.notification.findMany({
        where: {
          userId: user.id,
          type: "CONNECTION_REQUEST",
          actorId: { in: pendingSenderIds },
        },
        select: { actorId: true },
      });
      const notifiedSenderIds = new Set(
        existingNotifications.map((notification) => notification.actorId)
      );
      const unnotifiedSenderIds = pendingSenderIds.filter(
        (senderId) => !notifiedSenderIds.has(senderId)
      );

      if (unnotifiedSenderIds.length > 0) {
        await tx.notification.createMany({
          data: unnotifiedSenderIds.map((actorId) => ({
            userId: user.id,
            actorId,
            type: "CONNECTION_REQUEST",
            content: "You received a connection request",
            link: "/network",
            isRead: true,
          })),
        });
      }

      await tx.notification.updateMany({
        where: {
          userId: user.id,
          type: "CONNECTION_REQUEST",
          isRead: false,
        },
        data: { isRead: true },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark connection requests as read", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}