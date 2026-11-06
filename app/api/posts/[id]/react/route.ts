import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { POST_REACTION_TYPES } from "@/lib/reactions";
import { z } from "zod";
import { notifyPostReaction } from "@/lib/notify";

const reactionSchema = z.object({
  type: z.enum(POST_REACTION_TYPES),
});

/**
 * Sets the viewer's reaction on a post (idempotent: same type twice is a no-op,
 * a different type replaces the old one). Use DELETE to remove it.
 */
export async function POST( req: NextRequest, { params }: { params: Promise<{ id: string }> } ) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;
    const body = await req.json().catch(() => null);
    const validation = reactionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: "Invalid reaction type" }, { status: 400 });
    }

    const { type } = validation.data;

    const existingPost = await prisma.post.findUnique({ where: { id: postId, status: "ACTIVE" } });
    if (!existingPost) {
      return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
    }

    const existing = await prisma.postReaction.findUnique({
      where: { postId_userId: { postId, userId: user.id } },
    });

    await prisma.postReaction.upsert({
      where: { postId_userId: { postId, userId: user.id } },
      create: { postId, userId: user.id, type },
      update: { type },
    });

    if (!existing) await notifyPostReaction(postId, user.id);

    const status = existing ? 200 : 201;
    const message = !existing ? "Reaction added successfully" : existing.type === type ? "Reaction unchanged" : "Reaction changed successfully";
    return NextResponse.json({ success: true, message, type }, { status });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

/** Removes the viewer's reaction from a post (no error if there was none). */
export async function DELETE( _req: NextRequest, { params }: { params: Promise<{ id: string }> } ) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;
    await prisma.postReaction.deleteMany({ where: { postId, userId: user.id } });

    return NextResponse.json({ success: true, message: "Reaction removed successfully" });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
