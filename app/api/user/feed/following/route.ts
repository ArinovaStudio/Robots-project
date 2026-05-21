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

      whereClause = { authorId: { in: followingIds }, status: "ACTIVE" };
    }

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          media: true,
          author: {
            select: {
              id: true,
              name: true,
              company: { 
                select: { 
                  companyName: true, 
                  logoUrl: true, 
                  isBoosted: true,
                  website: true,
                  location: true,
                  lookingFor: true
                } 
              }
            }
          },
          _count: { select: { comments: true } },
          reactions: { where: { userId: user.id }, select: { type: true } },
          savedBy: { where: { userId: user.id }, select: { id: true } }
        }
      }),
      prisma.post.count({ where: whereClause })
    ]);

    const postIds = posts.map(p => p.id);
    const reactionCounts = postIds.length > 0 ? await prisma.postReaction.groupBy({
      by: ['postId', 'type'],
      where: { postId: { in: postIds } },
      _count: { type: true }
    }) : [];

    const formattedPosts = posts.map(post => {
      const likes = reactionCounts.find(r => r.postId === post.id && r.type === "LIKE")?._count.type || 0;
      const dislikes = reactionCounts.find(r => r.postId === post.id && r.type === "DISLIKE")?._count.type || 0;

      return {
        ...post,
        userReaction: post.reactions[0]?.type || null, 
        isSaved: post.savedBy?.length > 0,
        likesCount: likes,
        dislikesCount: dislikes
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedPosts,
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