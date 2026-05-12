import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
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
            select: { id: true, company: true }
          }
        }
      }),
      prisma.follow.count({ where: { followerId: user.id } })
    ]);

    const formattedFollowing = followingData.map(f => ({
      followId: f.id,
      followedAt: f.createdAt,
      ...f.following.company, 
      userId: f.following.id,
    }));

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