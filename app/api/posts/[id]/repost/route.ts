import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateTextContent } from "@/lib/textFilter";
import { visibleToViewer } from "@/lib/post-visibility";

const repostSchema = z.object({
  mode: z.enum(["instant", "thoughts"]),
  content: z.string().max(3000, "Your thoughts are too long").optional(),
  visibility: z.enum(["ANYONE", "CONNECTIONS"]).default("ANYONE"),
  commentAccess: z.enum(["ANYONE", "CONNECTIONS"]).default("ANYONE"),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = repostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
    }
    const { mode, visibility, commentAccess } = parsed.data;
    const content = parsed.data.content?.trim() || null;

    const { id: postId } = await params;
    const target = await prisma.post.findFirst({
      where: { id: postId, status: "ACTIVE", AND: [visibleToViewer(user.id)] },
      select: { id: true, authorId: true, visibility: true, repostOfId: true },
    });
    if (!target) {
      return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
    }
    const originalId = target.repostOfId ?? target.id;
    const original =
      originalId === target.id
        ? target
        : await prisma.post.findFirst({
            where: { id: originalId, status: "ACTIVE", AND: [visibleToViewer(user.id)] },
            select: { id: true, authorId: true, visibility: true, repostOfId: true },
          });
    if (!original) {
      return NextResponse.json({ success: false, message: "The original post is no longer available" }, { status: 404 });
    }

    if (original.visibility === "CONNECTIONS") {
      return NextResponse.json(
        { success: false, message: "This post is shared with connections only and can't be reposted" },
        { status: 403 }
      );
    }

    if (original.authorId === user.id) {
      return NextResponse.json({ success: false, message: "You can't repost your own post" }, { status: 400 });
    }

    if (mode === "thoughts") {
      if (!content) {
        return NextResponse.json({ success: false, message: "Add your thoughts to repost" }, { status: 400 });
      }
      const textValidation = validateTextContent(content);
      if (!textValidation.isValid) {
        return NextResponse.json(
          { success: false, message: "Your post contains inappropriate language that violates our community guidelines" },
          { status: 400 }
        );
      }
    } else {
      const existing = await prisma.post.findFirst({
        where: { authorId: user.id, repostOfId: original.id, content: null, status: "ACTIVE" },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json({ success: false, message: "You've already reposted this" }, { status: 409 });
      }
    }

    await prisma.post.create({
      data: {
        authorId: user.id,
        repostOfId: original.id,
        content: mode === "thoughts" ? content : null,
        ...(mode === "thoughts" && { visibility, commentAccess }),
      },
    });

    return NextResponse.json(
      { success: true, message: mode === "thoughts" ? "Reposted with your thoughts" : "Reposted" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { id: postId } = await params;

    const target = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, repostOfId: true } });
    const originalId = target?.repostOfId ?? target?.id ?? postId;

    const { count } = await prisma.post.deleteMany({
      where: { authorId: user.id, repostOfId: originalId },
    });

    if (count === 0) {
      return NextResponse.json({ success: false, message: "You haven't reposted this" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Repost removed" }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
