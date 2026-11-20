import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { summarizeReactions } from "@/lib/reactions";
import { getPendingReactionStates, getPendingCommentCounts, PENDING_REMOVED_REACTION } from "@/lib/interaction-write-behind";
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
                investor: { select: { firmName: true } },
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
            _count: { select: { comments: true, reposts: true } },
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

    // Merge unflushed Redis reactions over the persisted aggregate so Explore remains current.
    const [pendingPostReactions, pendingCommentCounts] = await Promise.all([
      getPendingReactionStates("POST_REACTION", postIds),
      getPendingCommentCounts(postIds),
    ]);
    const pendingReactionUsers = Array.from(new Set<string>(
      Object.values(pendingPostReactions).flatMap((states: Record<string, string>) => Object.keys(states))
    ));
    const persistedPendingReactions = postIds.length && pendingReactionUsers.length
      ? await prisma.postReaction.findMany({
          where: { postId: { in: postIds }, userId: { in: pendingReactionUsers } },
          select: { postId: true, userId: true, type: true },
        })
      : [];
    const persistedByKey = new Map<string, string>(
      persistedPendingReactions.map((row) => [`${row.postId}:${row.userId}`, String(row.type)] as [string, string])
    );
    const effectiveCountsByPost = new Map<string, Map<string, number>>();
    for (const row of reactionCounts) {
      const counts = effectiveCountsByPost.get(row.postId) || new Map<string, number>();
      counts.set(row.type, row._count.type);
      effectiveCountsByPost.set(row.postId, counts);
    }
    for (const [postId, states] of Object.entries(pendingPostReactions)) {
      const counts = effectiveCountsByPost.get(postId) || new Map<string, number>();
      for (const [userId, nextType] of Object.entries(states)) {
        const previousType = persistedByKey.get(`${postId}:${userId}`);
        if (previousType) counts.set(previousType, Math.max(0, (counts.get(previousType) || 0) - 1));
        if (nextType !== PENDING_REMOVED_REACTION) counts.set(nextType, (counts.get(nextType) || 0) + 1);
      }
      effectiveCountsByPost.set(postId, counts);
    }

    const activityByPost = new Map<string, { type: "COMMENTED" | "REACTED"; name: string; image: string | null }>();
    if (!targetUserId && tab === "foryou" && postIds.length > 0 && connectionIds.length > 0) {
      const nameSelect = { select: { name: true, image: true, investor: { select: { firmName: true } }, company: { select: { companyName: true } } } };
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
      const displayName = (u: { name: string | null; company: { companyName: string } | null; investor: { firmName: string | null } | null }) =>
        u.company?.companyName || u.name || u.investor?.firmName || "A connection";

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
      const effectiveGroups = Array.from(effectiveCountsByPost.get(post.id)?.entries() || [])
        .filter(([, count]) => count > 0)
        .map(([type, count]) => ({ type, _count: { type: count } }));
      const { likesCount, reactionCounts: reactionBreakdown } = summarizeReactions(effectiveGroups);
      const hasPendingViewerReaction = Object.prototype.hasOwnProperty.call(
        pendingPostReactions[post.id] || {},
        user.id
      );
      const pendingViewerReaction = pendingPostReactions[post.id]?.[user.id];
      const userReaction = hasPendingViewerReaction
        ? (pendingViewerReaction === PENDING_REMOVED_REACTION ? null : pendingViewerReaction)
        : post.reactions[0]?.type || null;

      if (post.author && post.author.company) {
        post.author.company.logoUrl = post.author.company.logoUrl || post.author.image;
      }

      return {
        ...post,
        connectionActivity: activityByPost.get(post.id) || null,
        userReaction,
        isSaved: post.savedBy?.length > 0,
        _count: {
          ...post._count,
          comments: post._count.comments + (pendingCommentCounts[post.id] || 0),
        },
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