import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, uploadImage } from "@/lib/uploads";

const MAX_IMAGE_SIZE = 40 * 1024 * 1024;
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;
const MAX_PDF_SIZE = 120 * 1024 * 1024;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ targetUserId: string }> },
) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await params;
    if (targetUserId === user.id) {
      return NextResponse.json({ success: false, message: "You cannot chat with yourself" }, { status: 400 });
    }

    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: user.id },
        ],
        status: "ACCEPTED",
      },
      select: { id: true },
    });
    if (!connection) {
      return NextResponse.json({ success: false, message: "You can only chat with accepted connections" }, { status: 403 });
    }

    const formData = await req.formData();
    const value = formData.get("media");
    if (!(value instanceof File) || value.size === 0) {
      return NextResponse.json({ success: false, message: "Choose an image, video, or PDF to upload." }, { status: 400 });
    }

    let type: "IMAGE" | "VIDEO" | "PDF";
    let url: string;
    if (value.type.startsWith("image/")) {
      if (value.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ success: false, message: "Images must be 40 MB or smaller." }, { status: 400 });
      }
      type = "IMAGE";
      url = await uploadImage(value, "messages/images");
    } else if (value.type.startsWith("video/")) {
      if (value.size > MAX_VIDEO_SIZE) {
        return NextResponse.json({ success: false, message: "Videos must be 200 MB or smaller." }, { status: 400 });
      }
      type = "VIDEO";
      url = await uploadFile(value, "messages/videos");
    } else if (value.type === "application/pdf") {
      if (value.size > MAX_PDF_SIZE) {
        return NextResponse.json({ success: false, message: "PDFs must be 120 MB or smaller." }, { status: 400 });
      }
      type = "PDF";
      url = await uploadFile(value, "messages/documents");
    } else {
      return NextResponse.json({ success: false, message: "Only images, videos, and PDFs are supported." }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: { url, type } }, { status: 201 });
  } catch (error) {
    console.error("Failed to upload chat media:", error);
    return NextResponse.json({ success: false, message: "Failed to upload media." }, { status: 500 });
  }
}
