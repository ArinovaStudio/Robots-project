import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
});

export async function PUT( req: NextRequest, { params }: { params: Promise<{ id: string }> } ) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { id: commentId } = await params;
    const body = await req.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const existingComment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!existingComment) {
      return NextResponse.json({ success: false, message: "Comment not found" }, { status: 404 });
    }
    
    if (existingComment.authorId !== user.id) {
      return NextResponse.json({ success: false, message: "You can only edit your own comments" }, { status: 403 });
    }

    await prisma.comment.update({
      where: { id: commentId },
      data: { content: validation.data.content }
    });

    return NextResponse.json({ success: true, message: "Comment updated successfully" }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE( req: NextRequest, { params }: { params: Promise<{ id: string }> } ) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { id: commentId } = await params;

    const existingComment = await prisma.comment.findUnique({ where: { id: commentId } });
    
    if (!existingComment) {
      return NextResponse.json({ success: false, message: "Comment not found" }, { status: 404 });
    }
    
    if (existingComment.authorId !== user.id) {
      return NextResponse.json({ success: false, message: "You can only delete your own comments" }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ success: true, message: "Comment deleted successfully" }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}