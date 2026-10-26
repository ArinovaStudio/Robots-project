import { NextRequest, NextResponse } from "next/server";
import { getOnboardedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const removeSchema = z.object({
  targetUserId: z.string().optional(),
  connectionId: z.string().optional(),
}).refine((data) => data.targetUserId || data.connectionId, {
  message: "Either targetUserId or connectionId is required",
});

async function handleRemove(req: NextRequest) {
  try {
    const { user, error } = await getOnboardedUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = removeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const { targetUserId, connectionId } = validation.data;

    let existingConnection = null;

    if (connectionId) {
      existingConnection = await prisma.connection.findFirst({
        where: {
          id: connectionId,
          OR: [
            { senderId: user.id },
            { receiverId: user.id }
          ]
        }
      });
    } else if (targetUserId) {
      existingConnection = await prisma.connection.findFirst({
        where: {
          OR: [
            { senderId: user.id, receiverId: targetUserId },
            { senderId: targetUserId, receiverId: user.id }
          ]
        }
      });
    }

    if (!existingConnection) {
      return NextResponse.json({ success: false, message: "No connection or request found" }, { status: 404 });
    }

    // Clean up notifications related to this request
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { userId: existingConnection.receiverId, actorId: existingConnection.senderId, type: "CONNECTION_REQUEST" },
          { userId: existingConnection.senderId, actorId: existingConnection.receiverId, type: "CONNECTION_REQUEST" },
        ]
      }
    });

    await prisma.connection.delete({ where: { id: existingConnection.id } });

    const message = existingConnection.status === "PENDING"
      ? "Connection request cancelled"
      : "Connection successfully removed";

    return NextResponse.json({ success: true, message }, { status: 200 });
  } catch (error) {
    console.error("Failed to remove/cancel connection:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  return handleRemove(req);
}

export async function POST(req: NextRequest) {
  return handleRemove(req);
}