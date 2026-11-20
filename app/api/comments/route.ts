import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser, getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { validateTextContent } from "@/lib/textFilter";
import { visibleToViewer, getConnectedAmong } from "@/lib/post-visibility";
import { notifyPostComment, notifyMentions } from "@/lib/notify";
import {
  enqueueComment,
  getPendingCommentStates,
  getPendingComment,
  getPendingReactionStates,
  PENDING_REMOVED_REACTION,
  type PendingComment,
} from "@/lib/interaction-write-behind";
import { randomUUID } from "node:crypto";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getUser();

    const { searchParams } = req.nextUrl;
    const postId = searchParams.get("postId");
    const parentId = searchParams.get("parentId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const offsetParam = searchParams.get("offset");
    const skip = offsetParam !== null
      ? Math.max(0, parseInt(offsetParam, 10) || 0)
      : (page - 1) * limit;

    if (!postId) {
      return NextResponse.json({ success: false, message: "Post ID is required" }, { status: 400 });
    }

    const pendingStates = await getPendingCommentStates(postId);
    const pendingIds = pendingStates.map((comment) => comment.id);
    const pendingForPost = pendingStates.filter((comment) => !comment.deleted);
    const pendingForParent = pendingForPost
      .filter((comment) => comment.parentId === (parentId || null))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const dbSkip = Math.max(0, skip - pendingForParent.length);
    const whereClause = {
      postId,
      parentId: parentId || null,
      ...(pendingIds.length ? { id: { notIn: pendingIds } } : {}),
    };

    const [dbComments, dbTotalCount, dbTotalWithReplies] = await Promise.all([
      prisma.comment.findMany({
        where: whereClause,
        skip: dbSkip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              investor: { select: { firmName: true } },
              company: { select: { companyName: true, logoUrl: true, isBoosted: true } }
            }
          },
          _count: { select: { replies: true } },
          ...(user?.id ? { reactions: { where: { userId: user.id }, select: { type: true } } } : {})
        }
      }),
      prisma.comment.count({ where: whereClause }),
      // every comment on the post (top-level + replies), only needed for the top-level list
      parentId ? Promise.resolve(null) : prisma.comment.count({
        where: { postId, ...(pendingIds.length ? { id: { notIn: pendingIds } } : {}) },
      }),
    ]);

    const pendingCommentCount = pendingForParent.length;
    const totalCount = dbTotalCount + pendingCommentCount;
    const totalWithReplies = parentId ? null : (dbTotalWithReplies ?? 0) + pendingForPost.length;
    const mergedComments = [
      ...pendingForParent.map((comment) => ({
        id: comment.id,
        postId: comment.postId,
        authorId: comment.authorId,
        content: comment.content,
        parentId: comment.parentId,
        isEdited: comment.isEdited,
        createdAt: new Date(comment.createdAt),
        updatedAt: new Date(comment.updatedAt),
        author: comment.author,
        _count: { replies: 0 },
        reactions: [] as { type: string }[],
      })),
      ...dbComments,
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(skip, skip + limit);

    const comments = mergedComments;
    const commentIds = comments.map(c => c.id);
    const [reactionCounts, pendingReactionStates] = await Promise.all([
      commentIds.length > 0 ? prisma.commentReaction.groupBy({
        by: ['commentId', 'type'],
        where: { commentId: { in: commentIds } },
        _count: { type: true }
      }) : Promise.resolve([]),
      getPendingReactionStates("COMMENT_REACTION", commentIds),
    ]);

    const pendingUsers = Array.from(new Set<string>(
      Object.values(pendingReactionStates).flatMap((states: Record<string, string>) => Object.keys(states))
    ));
    const persistedPendingReactions = commentIds.length && pendingUsers.length
      ? await prisma.commentReaction.findMany({
          where: { commentId: { in: commentIds }, userId: { in: pendingUsers } },
          select: { commentId: true, userId: true, type: true },
        })
      : [];
    const persistedByKey = new Map<string, string>(
      persistedPendingReactions.map((row) => [`${row.commentId}:${row.userId}`, String(row.type)] as [string, string])
    );

    const formattedComments = comments.map(comment => {
      let likes = reactionCounts.find(r => r.commentId === comment.id && r.type === "LIKE")?._count.type || 0;
      let dislikes = reactionCounts.find(r => r.commentId === comment.id && r.type === "DISLIKE")?._count.type || 0;
      const states = pendingReactionStates[comment.id] || {};

      for (const [userId, nextType] of Object.entries(states)) {
        const previousType = persistedByKey.get(`${comment.id}:${userId}`);
        if (previousType === "LIKE") likes -= 1;
        if (previousType === "DISLIKE") dislikes -= 1;
        if (nextType === "LIKE") likes += 1;
        if (nextType === "DISLIKE") dislikes += 1;
      }

      const viewerHasPending = Object.prototype.hasOwnProperty.call(states, user?.id || "");
      const userReaction = viewerHasPending
        ? (states[user?.id || ""] === PENDING_REMOVED_REACTION ? null : states[user?.id || ""])
        : (comment as any).reactions?.[0]?.type || null;

      const formatted = {
        ...comment,
        likesCount: Math.max(0, likes),
        dislikesCount: Math.max(0, dislikes),
        userReaction,
      };

      delete (formatted as any).reactions;
      return formatted;
    });

    formattedComments.sort((a, b) => b.likesCount - a.likesCount);

    return NextResponse.json({
      success: true,
      data: formattedComments,
      pagination: {
        total: totalCount,
        totalWithReplies: totalWithReplies ?? totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + comments.length < totalCount,
      }
    });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

const commentSchema = z.object({
  postId: z.string().min(1, "Post ID is required"),
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
  parentId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = commentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const { postId, content, parentId } = validation.data;

    const postExists = await prisma.post.findFirst({
      where: { id: postId, status: "ACTIVE", AND: [visibleToViewer(user.id)] },
    });
    if (!postExists) {
      return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
    }

    if (postExists.commentAccess === "CONNECTIONS" && postExists.authorId !== user.id) {
      const connected = await getConnectedAmong(user.id, [postExists.authorId]);
      if (!connected.has(postExists.authorId)) {
        return NextResponse.json({ success: false, message: "Only the author's connections can comment on this post" }, { status: 403 });
      }
    }

    let pendingParent: PendingComment | null = null;
    if (parentId) {
      const [parentExists, pending] = await Promise.all([
        prisma.comment.findUnique({ where: { id: parentId } }),
        getPendingComment(parentId),
      ]);
      pendingParent = pending;
      if (!parentExists && !pending) {
        return NextResponse.json({ success: false, message: "Parent comment not found" }, { status: 404 });
      }
      if ((parentExists?.postId || pending?.postId) !== postId) {
        return NextResponse.json({ success: false, message: "Parent comment belongs to a different post" }, { status: 400 });
      }
    }

    if (content){
      const textValidation = validateTextContent(content);

      if (!textValidation.isValid) {
        return NextResponse.json({
          success: false,
          message: "Your comment contains inappropriate language that violates our community guidelines"
        }, { status: 400 });
      }
    }

    const author = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        image: true,
        investor: { select: { firmName: true } },
        company: { select: { companyName: true, logoUrl: true, isBoosted: true } },
      },
    });
    if (!author) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const created: PendingComment = {
      id: randomUUID(),
      postId,
      authorId: user.id,
      content,
      parentId: parentId || null,
      isEdited: false,
      createdAt: now,
      updatedAt: now,
      version: 1,
      author,
    };
    await enqueueComment(created);

    const notified = await notifyPostComment(postId, user.id, parentId);
    if (pendingParent && pendingParent.authorId !== user.id && pendingParent.authorId !== postExists.authorId) {
      const actorName = author.company?.companyName || author.name || author.investor?.firmName || "Someone";
      await prisma.notification.createMany({
        data: [{
          userId: pendingParent.authorId,
          actorId: user.id,
          type: "NEW_COMMENT",
          content: `${actorName} replied to your comment`,
          link: `/post/${postId}`,
        }],
        skipDuplicates: true,
      });
      notified.push(pendingParent.authorId);
    }
    await notifyMentions({ content, actorId: user.id, postId, where: "comment", skipUserIds: notified });

    return NextResponse.json({
      success: true,
      message: "Comment added successfully",
      data: {
        id: created.id,
        postId: created.postId,
        authorId: created.authorId,
        content: created.content,
        parentId: created.parentId,
        isEdited: created.isEdited,
        author: created.author,
        createdAt: new Date(created.createdAt),
        updatedAt: new Date(created.updatedAt),
        _count: { replies: 0 },
        likesCount: 0,
        dislikesCount: 0,
        userReaction: null,
      },
    }, { status: 201 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}