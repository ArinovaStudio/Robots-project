import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser, getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { validateTextContent } from "@/lib/textFilter";
import { visibleToViewer, getConnectedAmong } from "@/lib/post-visibility";
import { notifyPostComment, notifyMentions } from "@/lib/notify";

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

    const whereClause = {
      postId,
      parentId: parentId || null,
    };

    const [comments, totalCount, totalWithReplies] = await Promise.all([
      prisma.comment.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              company: { select: { companyName: true, logoUrl: true, isBoosted: true } }
            }
          },
          _count: { select: { replies: true } },
          ...(user?.id ? { reactions: { where: { userId: user.id }, select: { type: true } } } : {})
        }
      }),
      prisma.comment.count({ where: whereClause }),
      // every comment on the post (top-level + replies), only needed for the top-level list
      parentId ? Promise.resolve(null) : prisma.comment.count({ where: { postId } }),
    ]);

    const commentIds = comments.map(c => c.id);
    const reactionCounts = commentIds.length > 0 ? await prisma.commentReaction.groupBy({
      by: ['commentId', 'type'],
      where: { commentId: { in: commentIds } },
      _count: { type: true }
    }) : [];

    const formattedComments = comments.map(comment => {
      const likes = reactionCounts.find(r => r.commentId === comment.id && r.type === "LIKE")?._count.type || 0;
      const dislikes = reactionCounts.find(r => r.commentId === comment.id && r.type === "DISLIKE")?._count.type || 0;

      const formatted = {
        ...comment,
        likesCount: likes,
        dislikesCount: dislikes,
        userReaction: (comment as any).reactions?.[0]?.type || null
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

    if (parentId) {
      const parentExists = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parentExists) {
        return NextResponse.json({ success: false, message: "Parent comment not found" }, { status: 404 });
      }
      if (parentExists.postId !== postId) {
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

    const created = await prisma.comment.create({
      data: { postId, authorId: user.id, content, parentId: parentId || null },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            company: { select: { companyName: true, logoUrl: true, isBoosted: true } }
          }
        },
        _count: { select: { replies: true } },
      }
    });

    const notified = await notifyPostComment(postId, user.id, parentId);
    await notifyMentions({ content, actorId: user.id, postId, where: "comment", skipUserIds: notified });

    return NextResponse.json({
      success: true,
      message: "Comment added successfully",
      data: { ...created, likesCount: 0, dislikesCount: 0, userReaction: null },
    }, { status: 201 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}