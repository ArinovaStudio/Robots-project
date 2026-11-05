import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;

    const post = await prisma.post.findUnique({ where: { id: postId, status: "ACTIVE" }, select: { id: true, authorId: true } });
    if (!post) {
      return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
    }
    if (post.authorId === user.id) {
      return NextResponse.json({ success: false, message: "You can't hide your own post" }, { status: 400 });
    }

    await prisma.hiddenPost.upsert({
      where: { userId_postId: { userId: user.id, postId } },
      create: { userId: user.id, postId },
      update: {},
    });

    return NextResponse.json({ success: true, message: "Post hidden" }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

/** Undo "not interested". */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;
    await prisma.hiddenPost.deleteMany({ where: { userId: user.id, postId } });

    return NextResponse.json({ success: true, message: "Post restored" });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
