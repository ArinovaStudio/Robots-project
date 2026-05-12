import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reportSchema = z.object({
  postId: z.string().min(1, "Post ID is required"),
  reason: z.enum(["SPAM", "NUDITY_OR_SEXUAL_CONTENT", "HATE_SPEECH", "HARASSMENT", "VIOLENCE", "COPYRIGHT_VIOLATION", "OTHER" ]),
  details: z.string().max(500, "Details cannot exceed 500 characters").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = reportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const { postId, reason, details } = validation.data;

    const targetPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true }
    });

    if (!targetPost) {
      return NextResponse.json({ success: false, message: "The post you are trying to report does not exist" }, { status: 404 });
    }

    if (targetPost.authorId === user.id) {
      return NextResponse.json({ success: false, message: "You cannot report your own post" }, { status: 400 });
    }

    const existingReport = await prisma.postReport.findUnique({
      where: { postId_userId: { postId, userId: user.id } }
    });

    if (existingReport) {
      return NextResponse.json({ success: false, message: "You have already reported this post" }, { status: 409 }); 
    }

    await prisma.postReport.create({
      data: { postId, userId: user.id,reason, details: details?.trim() ? details : null }
    });

    return NextResponse.json({ success: true, message: "Report submitted successfully" }, { status: 201 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}