import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, uploadImage } from "@/lib/uploads";
import { validateTextContent } from "@/lib/textFilter";

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const content = formData.get("content")?.toString().trim() || null;
    const files = formData.getAll("media") as File[];

    if (!content && files.length === 0) {
      return NextResponse.json( { success: false, message: "Post must contain text or media" }, { status: 400 });
    }

    if (content) {
      const textValidation = validateTextContent(content);
      
      if (!textValidation.isValid) {
        return NextResponse.json({ 
          success: false, 
          message: "Your post contains inappropriate language that violates our community guidelines" 
        }, { status: 400 });
      }
    }

    const uploadPromises = files.map(async (file) => {
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

    const uploadedMedia = await Promise.all(uploadPromises);

    await prisma.post.create({
      data: {
        authorId: user.id,
        content: content,
        media: {
          create: uploadedMedia.map((m) => ({
            url: m.url,
            type: m.type,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, message: "Post created successfully" }, { status: 201 });

  } catch {
    return NextResponse.json( { success: false, message: "Internal server error" }, { status: 500 } );
  }
}