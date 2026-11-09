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
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "15", 10)));
    const targetUserId = searchParams.get("userId");
    const skip = (page - 1) * limit;

    const tab = searchParams.get("tab") === "network" ? "network" : "foryou";

    const whereClause: any = { status: "ACTIVE" };

    // Accepted connections of the viewer (used by the Network tab and For-you activity labels)
    const connectionRows = await prisma.connection.findMany({
      where: { status: "ACCEPTED", OR: [{ senderId: user.id }, { receiverId: user.id }] },
      select: { senderId: true, receiverId: true },
    });
    const connectionIds = connectionRows.map((c) => (c.senderId === user.id ? c.receiverId : c.senderId));

    if (targetUserId) {
      whereClause.authorId = targetUserId;
    } else if (tab === "network") {
      // Network: only posts written by the viewer's connections
      whereClause.authorId = { in: connectionIds };
    }
    // For you: every visible post (visibleToViewer still hides posts the viewer may not see)

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

    const [rawPosts, totalCount] = await fetchPosts(whereClause);

    const posts = await withIsFollowing(await withHasReposted(await withCanComment(rawPosts, user.id), user.id), user.id);
    const postIds = posts.map(p => p.id);
    const reactionCounts = postIds.length > 0 ? await prisma.postReaction.groupBy({
      by: ['postId', 'type'],
      where: { postId: { in: postIds } },
      _count: { type: true }
    }) : [];
    const activityByPost = new Map<string, { type: "COMMENTED" | "REACTED"; name: string; image: string | null }>();
    if (!targetUserId && tab === "foryou" && postIds.length > 0 && connectionIds.length > 0) {
      const nameSelect = { select: { name: true, image: true, company: { select: { companyName: true } } } };
      const [connComments, connReactions] = await Promise.all([
        prisma.comment.findMany({
          where: { postId: { in: postIds }, authorId: { in: connectionIds } },
          orderBy: { createdAt: "desc" },
          select: { postId: true, author: nameSelect },
        }),
        prisma.postReaction.findMany({
          where: { postId: { in: postIds }, userId: { in: connectionIds } },
          orderBy: { createdAt: "desc" },
          select: { postId: true, user: nameSelect },
        }),
      ]);
      const displayName = (u: { name: string | null; company: { companyName: string } | null }) =>
        u.company?.companyName || u.name || "A connection";

      connReactions.forEach((r) => {
        if (!activityByPost.has(r.postId)) activityByPost.set(r.postId, { type: "REACTED", name: displayName(r.user), image: r.user.image ?? null });
      });
      // comments win over reactions when both exist
      connComments.forEach((c) => {
        if (activityByPost.get(c.postId)?.type !== "COMMENTED") {
          activityByPost.set(c.postId, { type: "COMMENTED", name: displayName(c.author), image: c.author.image ?? null });
        }
      });
    }

    const formattedPosts = posts.map(post => {
      const { likesCount, reactionCounts: reactionBreakdown } = summarizeReactions(reactionCounts.filter(r => r.postId === post.id));

      if (post.author && post.author.company) {
        post.author.company.logoUrl = post.author.company.logoUrl || post.author.image;
      }

      return {
        ...post,
        connectionActivity: activityByPost.get(post.id) || null,
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