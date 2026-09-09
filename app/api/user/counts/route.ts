import { NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { user, error } = await getOnboardedUser();
    
    if (error || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const [unreadNotifications, pendingConnections] = await Promise.all([
      prisma.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        }
      }),
      prisma.connection.count({
        where: {
          receiverId: user.id,
          status: "PENDING"
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        unreadNotifications,
        pendingConnections
      }
    });
  } catch (err) {
    console.error("Failed to fetch user counts", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
