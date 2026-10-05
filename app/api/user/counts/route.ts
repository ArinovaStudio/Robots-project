import { NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { user, error } = await getOnboardedUser();
    
    if (error || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const [unreadNotifications, pendingRequests, requestNotifications] = await Promise.all([
      prisma.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        }
      }),
      prisma.connection.findMany({
        where: {
          receiverId: user.id,
          status: "PENDING"
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
    ]);

    const notifiedSenders = new Set(
      requestNotifications.map((notification) => notification.actorId)
    );
    const pendingSenders = new Set(pendingRequests.map((request) => request.senderId));

    const unreadConnectionRequests = requestNotifications.filter(
      (notification) =>
        !notification.isRead && pendingSenders.has(notification.actorId || "")
    ).length + pendingRequests.filter(
      (request) => !notifiedSenders.has(request.senderId)
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        unreadNotifications,
        pendingConnections: pendingRequests.length,
        unreadConnectionRequests,
      }
    });
  } catch (err) {
    console.error("Failed to fetch user counts", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
