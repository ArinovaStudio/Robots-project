import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const removeSchema = z.object({
  targetUserId: z.string().min(1, "Target User ID is required"),
});

export async function DELETE(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = removeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const { targetUserId } = validation.data;

    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: user.id }
        ]
      }
    });

    if (!existingConnection) {
      return NextResponse.json({ success: false, message: "No active connection found with this user" }, { status: 404 });
    }

    await prisma.connection.delete({ where: { id: existingConnection.id } });

    return NextResponse.json({ success: true, message: "Connection successfully removed" }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}