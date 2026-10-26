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

    const [followingData, totalCount] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: user.id },
        skip: skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          following: {
            select: { id: true, name: true, image: true, accountType: true, company: true, investor: true }
          }
        }
      }),
      prisma.follow.count({ where: { followerId: user.id } })
    ]);

    const formattedFollowing = followingData.map(f => {
      const isInvestor = f.following.accountType === "INVESTOR";
      return {
        followId: f.id,
        followedAt: f.createdAt,
        name: isInvestor
          ? (f.following.name || f.following.investor?.firmName || "Investor")
          : (f.following.company?.companyName || f.following.name || "Unknown Company"),
        companyName: isInvestor
          ? (f.following.name || f.following.investor?.firmName || "Investor")
          : (f.following.company?.companyName || f.following.name || "Unknown Company"),
        logoUrl: isInvestor
          ? (f.following.image || null)
          : (f.following.company?.logoUrl || f.following.image || null),
        type: isInvestor
          ? (f.following.investor?.firmName
              ? `${f.following.investor.investorType} · ${f.following.investor.firmName}`
              : (f.following.investor?.investorType || "Investor"))
          : (f.following.company?.type || "Business"),
        company: f.following.company,
        investor: f.following.investor,
        userId: f.following.id,
        isInvestor,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedFollowing,
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