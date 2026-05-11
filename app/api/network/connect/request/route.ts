import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const requestSchema = z.object({
  receiverId: z.string().min(1, "Receiver ID is required"),
  message: z.string().max(500, "Message cannot exceed 500 characters").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const { receiverId, message } = validation.data;

    if (user.id === receiverId) {
      return NextResponse.json({ success: false, message: "You cannot connect with yourself" }, { status: 400 });
    }

    const receiverExists = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiverExists) {
      return NextResponse.json({ success: false, message: "Target user not found" }, { status: 404 });
    }

    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: receiverId },
          { senderId: receiverId, receiverId: user.id }
        ]
      }
    });

    if (existingConnection) {
      if (existingConnection.status === "PENDING") {
        return NextResponse.json({ success: false, message: "A pending connection request already exists" }, { status: 400 });
      } else if (existingConnection.status === "ACCEPTED") {
        return NextResponse.json({ success: false, message: "You are already connected" }, { status: 400 });
      } else {
        return NextResponse.json({ success: false, message: "Connection was previously rejected" }, { status: 400 });
      }
    }

    await prisma.connection.create({
      data: {
        senderId: user.id,
        receiverId: receiverId,
        message: message || null,
        status: "PENDING"
      }
    });

    return NextResponse.json({ success: true, message: "Connection request sent successfully" }, { status: 200 });

  } catch { 
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}