import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Send a member's profile link to one or more connections as a direct message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json(
        { success: false, message: error || "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId: profileUserId } = await params;
    const { recipientIds, message } = await req.json();

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Please select at least one connection." },
        { status: 400 }
      );
    }

    const profileUser = await prisma.user.findUnique({
      where: { id: profileUserId },
      select: { id: true, name: true },
    });

    if (!profileUser) {
      return NextResponse.json(
        { success: false, message: "Profile not found." },
        { status: 404 }
      );
    }

    const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || "";
    const profileUrl = `${origin}/profile/${profileUserId}`;
    const trimmed = typeof message === "string" ? message.trim() : "";
    const shareMessageContent = trimmed
      ? `${trimmed}\n\nShared profile: ${profileUrl}`
      : `Check out this profile: ${profileUrl}`;

    let sentCount = 0;

    for (const recipientId of recipientIds) {
      if (typeof recipientId !== "string" || recipientId === user.id) continue;

      // Only accepted connections can be messaged this way
      const connection = await prisma.connection.findFirst({
        where: {
          OR: [
            { senderId: user.id, receiverId: recipientId },
            { senderId: recipientId, receiverId: user.id },
          ],
          status: "ACCEPTED",
        },
      });
      if (!connection) continue;

      const [user1Id, user2Id] = [user.id, recipientId].sort();

      const conversation = await prisma.conversation.upsert({
        where: { user1Id_user2Id: { user1Id, user2Id } },
        update: { lastMessage: shareMessageContent, lastMessageAt: new Date() },
        create: {
          user1Id,
          user2Id,
          lastMessage: shareMessageContent,
          lastMessageAt: new Date(),
        },
      });

      await prisma.directMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          content: shareMessageContent,
        },
      });

      try {
        await prisma.notification.create({
          data: {
            userId: recipientId,
            actorId: user.id,
            type: "NEW_MESSAGE",
            content: `${user.name || "Someone"} shared a profile with you`,
            link: `/messages/${user.id}`,
          },
        });
      } catch (notifErr) {
        console.error("Failed to create profile share notification:", notifErr);
      }

      sentCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Profile shared with ${sentCount} connection${sentCount === 1 ? "" : "s"}.`,
      data: { sentCount },
    });
  } catch (err) {
    console.error("Share profile error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to share profile." },
      { status: 500 }
    );
  }
}