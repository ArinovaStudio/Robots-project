import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reactionSchema = z.object({
  type: z.enum(["LIKE", "DISLIKE"]),
});

export async function POST( req: NextRequest, { params }: { params: Promise<{ id: string }> } ) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;
    const body = await req.json();
    const validation = reactionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const { type } = validation.data;

    const existingPost = await prisma.post.findUnique({ where: { id: postId, status: "ACTIVE" } });
    if (!existingPost) {
      return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
    }

    const existingReaction = await prisma.postReaction.findUnique({
      where: { postId_userId: {  postId, userId: user.id } }
    });

    if (existingReaction) {
      if (existingReaction.type === type) {

        await prisma.postReaction.delete({ where: { id: existingReaction.id } });

        return NextResponse.json({ success: true, message: "Reaction removed successfully" });
      } else {

        await prisma.postReaction.update({ where: { id: existingReaction.id }, data: { type } });

        return NextResponse.json({ success: true, message: "Reaction changed successfully" });
      }
    }

    await prisma.postReaction.create({ data: { postId, userId: user.id, type } });

    return NextResponse.json({ success: true, message: "Reaction added successfully" }, { status: 201 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}