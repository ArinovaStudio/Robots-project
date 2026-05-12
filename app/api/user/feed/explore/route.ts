import { NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMatches } from "@/lib/match";

export async function GET(req: Request) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "15", 10)));
    const targetUserId = searchParams.get("userId");
    const skip = (page - 1) * limit;

    let whereClause: any = { };

    if (targetUserId) {
      whereClause = { authorId: targetUserId, status: "ACTIVE" };
    } else {

      const followingRecords = await prisma.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true }
      });
      const followingIds = followingRecords.map(f => f.followingId);
      followingIds.push(user.id);

      const [similarCompanies, suggestedCompanies] = await Promise.all([
        getMatches(user.id, "similar"),
        getMatches(user.id, "suggested")
      ]);

      const aiMatchedUserIds = [...similarCompanies, ...suggestedCompanies].map(c => c.userId);
      const uniqueMatchedIds = [...new Set(aiMatchedUserIds)].filter(id => !followingIds.includes(id));

      if (uniqueMatchedIds.length > 0) {
        whereClause = {
          authorId: { notIn: followingIds }, status: "ACTIVE",
          OR: [
            { authorId: { in: uniqueMatchedIds } },
            { author: { company: { isBoosted: true } } } 
          ]
        };
      } else {
        whereClause = { authorId: { notIn: followingIds }, status: "ACTIVE" };
      }
    }

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [
          { author: { company: { isBoosted: 'desc' } } }, 
          { createdAt: 'desc' }
        ],
        include: {
          media: true,
          author: {
            select: {
              id: true,
              name: true,
              company: { select: { companyName: true, logoUrl: true, isBoosted: true } }
            }
          },
          _count: {
            select: { comments: true, reactions: true }
          }
        }
      }),
      prisma.post.count({ where: whereClause })
    ]);

    const shuffledPosts = targetUserId ? posts : posts.sort(() => 0.5 - Math.random());

    return NextResponse.json({
      success: true,
      data: shuffledPosts,
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