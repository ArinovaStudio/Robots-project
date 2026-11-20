import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { enqueueCommentReaction, getPendingReactionStates, getPendingComment, PENDING_REMOVED_REACTION } from "@/lib/interaction-write-behind";

const reactionSchema = z.object({
  type: z.enum(["LIKE", "DISLIKE"])
});

export async function POST( req: NextRequest, { params }: { params: Promise<{ id: string }> } ) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { id: commentId } = await params;
    const body = await req.json();
    const validation = reactionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const [existingComment, pendingComment] = await Promise.all([
      prisma.comment.findUnique({ where: { id: commentId } }),
      getPendingComment(commentId),
    ]);
    if (!existingComment && !pendingComment) {
      return NextResponse.json({ success: false, message: "Comment not found" }, { status: 404 });
    }

    const { type } = validation.data;

    const [existingReaction, pendingByComment] = await Promise.all([
      prisma.commentReaction.findUnique({
        where: { commentId_userId: { commentId, userId: user.id } }
      }),
      getPendingReactionStates("COMMENT_REACTION", [commentId]),
    ]);
    const pending = pendingByComment[commentId] || {};
    const hasPendingState = Object.prototype.hasOwnProperty.call(pending, user.id);
    const effectiveType = hasPendingState
      ? (pending[user.id] === PENDING_REMOVED_REACTION ? null : pending[user.id])
      : existingReaction?.type ?? null;

    if (effectiveType === type) {
      await enqueueCommentReaction(commentId, user.id, null);
      return NextResponse.json({ success: true, message: "Reaction removed successfully" }, { status: 200 });
    }

    await enqueueCommentReaction(commentId, user.id, type);
    return NextResponse.json({
      success: true,
      message: effectiveType ? "Reaction changed successfully" : "Reaction added successfully"
    }, { status: effectiveType ? 200 : 201 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}