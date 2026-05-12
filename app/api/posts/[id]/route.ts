import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, uploadImage, deleteFile } from "@/lib/uploads";

export async function GET( req: NextRequest, { params }: { params: Promise<{ id: string }> } ) {
  try {
    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        media: true,
        author: {
          select: {
            id: true,
            name: true,
            company: { select: { companyName: true, logoUrl: true, isBoosted: true } }
          }
        },
        _count: {
          select: { comments: true, reactions: true }
        }
      }
    });

    if (!post){
        return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: post }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT( req: NextRequest, { params }: { params: Promise<{ id: string }> } ) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingPost = await prisma.post.findUnique({
      where: { id },
      include: { media: true }
    });

    if (!existingPost){
        return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
    }

    if (existingPost.authorId !== user.id){
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const content = formData.get("content")?.toString() || null;
    const newMediaFiles = formData.getAll("newMedia") as File[];
    const deletedMediaIdsStr = formData.get("deletedMediaIds")?.toString() || "[]";

    let deletedMediaIds: string[] = [];
    try {
      deletedMediaIds = JSON.parse(deletedMediaIdsStr);
    } catch {
      deletedMediaIds = [];
    }

    if (deletedMediaIds.length > 0) {
      const mediaToDelete = existingPost.media.filter(m => deletedMediaIds.includes(m.id));
      
      await Promise.all(mediaToDelete.map(m => deleteFile(m.url)));
      
      await prisma.postMedia.deleteMany({ where: { id: { in: deletedMediaIds }, postId: id } });
    }

    let uploadedMediaData: { url: string; type: "IMAGE" | "VIDEO" | "DOCUMENT" }[] = [];

    if (newMediaFiles.length > 0) {
      const uploadPromises = newMediaFiles.map(async (file) => {
        const mimeType = file.type;
        let mediaType: "IMAGE" | "VIDEO" | "DOCUMENT";
        let url: string;

        if (mimeType.startsWith("image/")) {
          mediaType = "IMAGE";
          url = await uploadImage(file, "posts/images");
        } else if (mimeType.startsWith("video/")) {
          mediaType = "VIDEO";
          url = await uploadFile(file, "posts/videos");
        } else {
          mediaType = "DOCUMENT";
          url = await uploadFile(file, "posts/documents");
        }
        return { url, type: mediaType };
      });

      uploadedMediaData = await Promise.all(uploadPromises);
    }

    await prisma.post.update({
      where: { id },
      data: {
        content,
        media: { create: uploadedMediaData }
      },
    });

    return NextResponse.json({ success: true, message: "Post updated successfully" });

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

    const { id } = await params;

    const existingPost = await prisma.post.findUnique({
      where: { id },
      include: { media: true }
    });

    if (!existingPost){
        return NextResponse.json({ success: false, message: "Post not found" }, { status: 404 });
    }

    if (existingPost.authorId !== user.id){
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    if (existingPost.media.length > 0) {
      await Promise.all(existingPost.media.map(m => deleteFile(m.url)));
    }

    await prisma.post.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Post deleted successfully" }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}