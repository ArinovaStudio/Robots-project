import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { summarizeReactions } from "@/lib/reactions";
import { getSuggestedFeedAuthors } from "@/lib/match";
import { visibleToViewer, withCanComment, withHasReposted, withIsFollowing, notHiddenBy, repostOfInclude } from "@/lib/post-visibility";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "15", 10)));
    const targetUserId = searchParams.get("userId");
    const skip = (page - 1) * limit;

    const whereClause: any = { status: "ACTIVE" };

    if (targetUserId) {
      whereClause.authorId = targetUserId;
    } else {
      const followingRecords = await prisma.follow.findMany({
        where: { followerId: user.id },
        select: { followingId: true }
      });

      const followingIds = followingRecords.map(f => f.followingId);

      const aiMatchedUserIds = await getSuggestedFeedAuthors(user.id);

      whereClause.OR = [
        { authorId: user.id },
        { authorId: { in: followingIds } },
        { authorId: { in: aiMatchedUserIds } },
        { author: { company: { isBoosted: true } } }
      ];
    }

    const fetchPosts = async (baseWhere: any) => {
      const currentWhere = { AND: [baseWhere, visibleToViewer(user.id), notHiddenBy(user.id)] };
      return await Promise.all([
        prisma.post.findMany({
          where: currentWhere,
          skip,
          take: limit,
          orderBy: [
            { author: { company: { isBoosted: 'desc' } } }, 
            { updatedAt: 'desc' }
          ],
          include: {
            media: true,
            event: true,
            repostOf: repostOfInclude,
            author: {
              select: {
                id: true,
                name: true,
                image: true,
                verificationStatus: true,
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
        prisma.post.count({ where: currentWhere })
      ]);
    };

    let [rawPosts, totalCount] = await fetchPosts(whereClause);

    if (rawPosts.length === 0 && !targetUserId) {
      const fallbackWhere = { status: "ACTIVE" }; 
      const [fallbackPosts, fallbackCount] = await fetchPosts(fallbackWhere);
      rawPosts = fallbackPosts;
      totalCount = fallbackCount;
    }

    const posts = await withIsFollowing(await withHasReposted(await withCanComment(rawPosts, user.id), user.id), user.id);
    const postIds = posts.map(p => p.id);
    const reactionCounts = postIds.length > 0 ? await prisma.postReaction.groupBy({
      by: ['postId', 'type'],
      where: { postId: { in: postIds } },
      _count: { type: true }
    }) : [];

    const formattedPosts = posts.map(post => {
      const { likesCount, reactionCounts: reactionBreakdown } = summarizeReactions(reactionCounts.filter(r => r.postId === post.id));

      if (post.author && post.author.company) {
        post.author.company.logoUrl = post.author.company.logoUrl || post.author.image;
      }

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