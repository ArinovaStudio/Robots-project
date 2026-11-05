import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { summarizeReactions } from "@/lib/reactions";
import { withCanComment, withHasReposted, withIsFollowing, repostOfInclude } from "@/lib/post-visibility";

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

    const [savedPostsData, totalCount] = await Promise.all([
      prisma.savedPost.findMany({
        where: { userId: user.id, post: { status: "ACTIVE" } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
            include: { 
              media: true,
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
            }
          }
        }
      }),
      prisma.savedPost.count({ where: { userId: user.id, post: { status: "ACTIVE" } } })
    ]);

    const withAccess = await withIsFollowing(await withHasReposted(await withCanComment(savedPostsData.map(sp => sp.post), user.id), user.id), user.id);
    savedPostsData.forEach((sp, i) => { sp.post = withAccess[i] as typeof sp.post; });
    const postIds = savedPostsData.map(sp => sp.postId);
    const reactionCounts = postIds.length > 0 ? await prisma.postReaction.groupBy({
      by: ['postId', 'type'],
      where: { postId: { in: postIds } },
      _count: { type: true }
    }) : [];

    const formattedPosts = savedPostsData.map(savedRecord => {
      const post = savedRecord.post;
      
      const { likesCount, reactionCounts: reactionBreakdown } = summarizeReactions(reactionCounts.filter(r => r.postId === post.id));

      return {
        ...post,
        savedAt: savedRecord.createdAt,
        userReaction: post.reactions[0]?.type || null, 
        isSaved: true, 
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