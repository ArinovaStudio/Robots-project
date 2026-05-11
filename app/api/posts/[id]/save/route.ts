import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST( req: NextRequest, { params }: { params: Promise<{ id: string }> } ) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;

    const existingPost = await prisma.post.findUnique({ where: { id: postId } });
    if (!existingPost) {
      return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
    }

    const existingSave = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId: user.id, postId } }
    });

    if (existingSave) {
      await prisma.savedPost.delete({ where: { id: existingSave.id } });

      return NextResponse.json({ success: true, message: "Post removed from saved collection" }, { status: 200 });
    }

    await prisma.savedPost.create({ data: { userId: user.id, postId } });

    return NextResponse.json({ success: true, message: "Post saved successfully" }, { status: 201 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}