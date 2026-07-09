import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

    const existingComment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!existingComment) {
      return NextResponse.json({ success: false, message: "Comment not found" }, { status: 404 });
    }

    const { type } = validation.data;

    const existingReaction = await prisma.commentReaction.findUnique({
      where: { commentId_userId: { commentId, userId: user.id } }
    });

    if (existingReaction) {
      if (existingReaction.type === type) {

        await prisma.commentReaction.delete({ where: { id: existingReaction.id } });

        return NextResponse.json({ success: true, message: "Reaction removed successfully" }, { status: 200 });
      } else {

        await prisma.commentReaction.update({ where: { id: existingReaction.id }, data: { type } });

        return NextResponse.json({ success: true, message: "Reaction changed successfully" }, { status: 200 });
      }
    }

    await prisma.commentReaction.create({ data: { commentId, userId: user.id, type } });

    return NextResponse.json({ success: true, message: "Reaction added successfully" }, { status: 201 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}