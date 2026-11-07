import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile, uploadImage } from "@/lib/uploads";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

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
      return NextResponse.json({ success: false, message: "Choose an image or video to upload." }, { status: 400 });
    }

    let type: "IMAGE" | "VIDEO";
    let url: string;
    if (value.type.startsWith("image/")) {
      if (value.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ success: false, message: "Images must be 10 MB or smaller." }, { status: 400 });
      }
      type = "IMAGE";
      url = await uploadImage(value, "messages/images");
    } else if (value.type.startsWith("video/")) {
      if (value.size > MAX_VIDEO_SIZE) {
        return NextResponse.json({ success: false, message: "Videos must be 50 MB or smaller." }, { status: 400 });
      }
      type = "VIDEO";
      url = await uploadFile(value, "messages/videos");
    } else {
      return NextResponse.json({ success: false, message: "Only images and videos are supported." }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: { url, type } }, { status: 201 });
  } catch (error) {
    console.error("Failed to upload chat media:", error);
    return NextResponse.json({ success: false, message: "Failed to upload media." }, { status: 500 });
  }
}
