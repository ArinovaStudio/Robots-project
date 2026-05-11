import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    const parentId = searchParams.get("parentId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    if (!postId) {
      return NextResponse.json({ success: false, message: "Post ID is required" }, { status: 400 });
    }

    const whereClause = {
      postId,
      parentId: parentId || null, 
    };

    const [comments, totalCount] = await Promise.all([
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
          _count: { select: { replies: true, reactions: true } }
        }
      }),
      prisma.comment.count({ where: whereClause })
    ]);

    return NextResponse.json({
      success: true,
      data: comments,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
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

    const postExists = await prisma.post.findUnique({ where: { id: postId } });
    if (!postExists) {
      return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
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

    await prisma.comment.create({
      data: { postId, authorId: user.id, content, parentId: parentId || null }
    });

    return NextResponse.json({ success: true, message: "Comment added successfully" }, { status: 201 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}