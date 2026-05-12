import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth"; 

export async function GET( req: NextRequest, { params }: { params: Promise<{ userId: string }> } ) {
  try {
    const { userId } = await params;

    const { user: currentUser } = await getUser();

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true,
        company: true, 
        _count: {
          select: {
            followers: true,
            following: true,
            sentConnections: { where: { status: "ACCEPTED" } },
            receivedConnections: { where: { status: "ACCEPTED" } }
          }
        }
      }
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, message: "Profile not found" }, { status: 404 });
    }

    const totalConnections = targetUser._count.sentConnections + targetUser._count.receivedConnections;

    let isFollowing = false;
    let connectionStatus = null;

    if (currentUser && currentUser.id !== userId) {
      const followRecord = await prisma.follow.findUnique({
        where: {
          followerId_followingId: { followerId: currentUser.id, followingId: userId }
        }
      });
      isFollowing = !!followRecord;

      const connectionRecord = await prisma.connection.findFirst({
        where: {
          OR: [
            { senderId: currentUser.id, receiverId: userId },
            { senderId: userId, receiverId: currentUser.id }
          ]
        }
      });
      if (connectionRecord) {
        connectionStatus = connectionRecord.status;
      }
    }

    const profileData = {
      userId: targetUser.id,
      name: targetUser.name,
      image: targetUser.image,
      joinedAt: targetUser.createdAt,
      company: targetUser.company,
      stats: {
        followers: targetUser._count.followers,
        following: targetUser._count.following,
        connections: totalConnections
      },
      viewerState: {
        isFollowing,
        connectionStatus
      }
    };

    return NextResponse.json({ success: true, data: profileData }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}