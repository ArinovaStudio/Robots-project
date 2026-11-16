import { NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const { user, error } = await getOnboardedUser();

    if (error || !user) {
      const dbProblem = error === "Internal server error";
      return NextResponse.json(
        { success: false, message: dbProblem ? "Service temporarily unavailable" : "Unauthorized" },
        { status: dbProblem ? 503 : 401, headers: NO_STORE }
      );
    }
    const [seenRow, pendingRequests, requestNotifications, unreadMessages] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { notificationsSeenAt: true },
      }),
      prisma.connection.findMany({
        where: {
          receiverId: user.id,
          status: "PENDING",
        },
        select: { senderId: true },
      }),
      prisma.notification.findMany({
        where: {
          userId: user.id,
          type: "CONNECTION_REQUEST",
        },
        select: { actorId: true, isRead: true },
      }),
      prisma.directMessage.count({
        where: {
          isRead: false,
          isDeleted: false,
          senderId: { not: user.id },
          conversation: {
            OR: [{ user1Id: user.id }, { user2Id: user.id }],
          },
        },
      }),
    ]);

    const seenAt = seenRow?.notificationsSeenAt ?? new Date(0);

    const unreadNotifications = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
        createdAt: { gt: seenAt },
      },
    });

    const notifiedSenders = new Set(
      requestNotifications.map((notification) => notification.actorId)
    );
    const pendingSenders = new Set(pendingRequests.map((request) => request.senderId));

    const unreadConnectionRequests =
      requestNotifications.filter(
        (notification) =>
          !notification.isRead && pendingSenders.has(notification.actorId || "")
      ).length +
      pendingRequests.filter((request) => !notifiedSenders.has(request.senderId)).length;

    return NextResponse.json(
      {
        success: true,
        data: {
          unreadNotifications,
          pendingConnections: pendingRequests.length,
          unreadConnectionRequests,
          unreadMessages,
        },
      },
      { headers: NO_STORE }
    );
  } catch (err) {
    console.error("Failed to fetch user counts", err);
    // Every query here is a DB read, so a failure is a temporary outage, not a bug in the request.
    return NextResponse.json(
      { success: false, message: "Service temporarily unavailable" },
      { status: 503, headers: { ...NO_STORE, "Retry-After": "5" } }
    );
  }
}