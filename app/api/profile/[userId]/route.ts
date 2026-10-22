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
        accountType: true,
        verificationStatus: true,
        createdAt: true,
        company: true, 
        investor: true,
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

    // Calculate dynamic Connected Investors (for companies) and Connected Companies (for investors)
    const [connectedInvestorsCount, connectedCompaniesCount, recordedInvestments] = await Promise.all([
      prisma.connection.count({
        where: {
          status: "ACCEPTED",
          OR: [
            { senderId: userId, receiver: { accountType: "INVESTOR" } },
            { receiverId: userId, sender: { accountType: "INVESTOR" } }
          ]
        }
      }),
      prisma.connection.count({
        where: {
          status: "ACCEPTED",
          OR: [
            { senderId: userId, receiver: { accountType: "BUSINESS" } },
            { receiverId: userId, sender: { accountType: "BUSINESS" } }
          ]
        }
      }),
      prisma.$queryRaw<any[]>`
        SELECT id, "companyName", amount, stage, year, notes, "createdAt"
        FROM "InvestorInvestment"
        WHERE "investorId" = ${userId}
        ORDER BY "createdAt" DESC
      `.catch(() => [])
    ]);

    const baseInvestedCount = targetUser.investor?.previousInvestmentCount || targetUser.investor?.previousStartups?.length || 0;
    const investedInCount = baseInvestedCount + recordedInvestments.length;

    let isFollowing = false;
    let connectionStatus = null;
    const isOwnProfile = currentUser?.id === userId;

    if (currentUser && !isOwnProfile) {
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
      
      if (targetUser.company) {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        prisma.profileViewStat.upsert({
          where: { companyId_date: { companyId: targetUser.company.id, date: today } },
          update: { count: { increment: 1 } },
          create: { companyId: targetUser.company.id, date: today }
        }).catch(() => {});
      }
    }

    const profileData = {
      userId: targetUser.id,
      name: targetUser.name,
      image: targetUser.image,
      accountType: targetUser.accountType,
      verificationStatus: targetUser.verificationStatus || "UNVERIFIED",
      joinedAt: targetUser.createdAt,
      company: targetUser.company ? {
        ...targetUser.company,
        logoUrl: targetUser.company.logoUrl || targetUser.image
      } : null,
      investor: targetUser.investor ? {
        ...targetUser.investor,
        recordedInvestments
      } : null,
      stats: {
        followers: targetUser._count.followers,
        following: targetUser._count.following,
        connections: totalConnections,
        connectedInvestors: connectedInvestorsCount,
        connectedCompanies: connectedCompaniesCount,
        investedIn: investedInCount
      },
      viewerState: {
        isFollowing,
        connectionStatus,
        isOwnProfile
      }
    };

    return NextResponse.json({ success: true, data: profileData }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}