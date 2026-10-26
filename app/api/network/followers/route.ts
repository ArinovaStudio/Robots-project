import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    const [followersData, totalCount] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: user.id },
        skip: skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          follower: {
            select: { id: true, name: true, image: true, email: true, accountType: true, company: true, investor: true }
          }
        }
      }),
      prisma.follow.count({ where: { followingId: user.id } })
    ]);

    const followerIds = followersData.map(f => f.follower.id);
    const mutualFollows = await prisma.follow.findMany({
      where: {
        followerId: user.id,
        followingId: { in: followerIds }
      },
      select: { followingId: true }
    });

    const mutualSet = new Set(mutualFollows.map(mf => mf.followingId));

    const formattedFollowers = followersData.map(f => {
      const isInvestor = f.follower.accountType === "INVESTOR";
      return {
        followId: f.id,
        followedAt: f.createdAt,
        name: isInvestor
          ? (f.follower.name || f.follower.investor?.firmName || "Investor")
          : (f.follower.company?.companyName || f.follower.name || "Unknown Company"),
        companyName: isInvestor
          ? (f.follower.name || f.follower.investor?.firmName || "Investor")
          : (f.follower.company?.companyName || f.follower.name || "Unknown Company"),
        logoUrl: isInvestor
          ? (f.follower.image || null)
          : (f.follower.company?.logoUrl || f.follower.image || null),
        type: isInvestor
          ? (f.follower.investor?.firmName
              ? `${f.follower.investor.investorType} · ${f.follower.investor.firmName}`
              : (f.follower.investor?.investorType || "Investor"))
          : (f.follower.company?.type || "Business"),
        company: f.follower.company,
        investor: f.follower.investor,
        userId: f.follower.id,
        isInvestor,
        isFollowing: mutualSet.has(f.follower.id),
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedFollowers,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      }
    });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}