import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { deleteFile } from "@/lib/uploads";
import { sendEmail } from "@/lib/email";
import { getPostModerationEmail } from "@/lib/template";

const actionSchema = z.object({
  action: z.enum(["SUSPEND", "DELETE", "DISMISS"])
});

export async function PUT( req: NextRequest, { params }: { params: Promise<{ postId: string }> } ) {
  try {
    const { user, error } = await getAdmin();
    if (error || !user) {
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = actionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const { action } = validation.data;
    const { postId } = await params;

    const targetPost = await prisma.post.findUnique({
      where: { id: postId },
      include: { 
        media: true, 
        _count: { select: { reports: true } },
        author: { select: { name: true, email: true } }
      }
    });

    if (!targetPost) {
      return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
    }

    if (targetPost._count.reports === 0) {
      return NextResponse.json({ success: false, message: "This post has no active reports" }, { status: 400 });
    }

    if (action === "DISMISS") {

      await prisma.$transaction([
        prisma.postReport.deleteMany({ where: { postId } }),
        prisma.post.update({ where: { id: postId }, data: { status: "ACTIVE" } })
      ]);

      return NextResponse.json({ success: true, message: "Reports dismissed " }, { status: 200 });
    } 
    
    else if (action === "SUSPEND") {

      await prisma.$transaction([
        prisma.postReport.updateMany({ where: { postId }, data: { status: "ACTION_TAKEN" } }),
        prisma.post.update({ where: { id: postId }, data: { status: "SUSPENDED" } })
      ]);

      if (targetPost.author.email){
        sendEmail({
            to: targetPost.author.email,
            subject: "Notice: Your post has been suspended",
            html: getPostModerationEmail(targetPost.author.name || "User", "SUSPENDED", targetPost.content)
        });
      }

      return NextResponse.json({ success: true, message: "Post suspended successfully" }, { status: 200 });
    } 
    
    else if (action === "DELETE") {
      
      if (targetPost.media.length > 0) {
        await Promise.all(targetPost.media.map(m => deleteFile(m.url)));
      }

      await prisma.post.delete({ where: { id: postId } });

      if (targetPost.author.email){
        sendEmail({
            to: targetPost.author.email,
            subject: "Notice: Your post has been deleted",
            html: getPostModerationEmail(targetPost.author.name || "User", "DELETED", targetPost.content)
        });
      }
      
      return NextResponse.json({ success: true, message: "Post and all associated media have been permanently deleted" }, { status: 200 });
    }

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}