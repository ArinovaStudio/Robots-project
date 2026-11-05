import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { summarizeReactions } from "@/lib/reactions";
import { visibleToViewer, withCanComment, withHasReposted, withIsFollowing, notHiddenBy, repostOfInclude } from "@/lib/post-visibility";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
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

    const visibleWhere = { AND: [whereClause, visibleToViewer(user.id), notHiddenBy(user.id)] };

    const [rawPosts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: visibleWhere,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          media: true,
          event: true,
          repostOf: repostOfInclude,
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
      prisma.post.count({ where: visibleWhere })
    ]);

    const posts = await withIsFollowing(await withHasReposted(await withCanComment(rawPosts, user.id), user.id), user.id);
    const postIds = posts.map(p => p.id);
    const reactionCounts = postIds.length > 0 ? await prisma.postReaction.groupBy({
      by: ['postId', 'type'],
      where: { postId: { in: postIds } },
      _count: { type: true }
    }) : [];

    const formattedPosts = posts.map(post => {
      const { likesCount, reactionCounts: reactionBreakdown } = summarizeReactions(reactionCounts.filter(r => r.postId === post.id));

      return {
        ...post,
        userReaction: post.reactions[0]?.type || null, 
        isSaved: post.savedBy?.length > 0,
        likesCount,
        reactionCounts: reactionBreakdown
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