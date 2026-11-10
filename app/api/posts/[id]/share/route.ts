import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json(
        { success: false, message: error || "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: postId } = await params;
    const body = await req.json();
    const { recipientIds, message } = body;

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Please select at least one connection." },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        content: true,
        author: {
          select: {
            name: true,
            company: { select: { companyName: true } },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, message: "Post not found." },
        { status: 404 }
      );
    }

    const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || "";
    const postUrl = `${origin}/post/${postId}`;
    const shareMessageContent = message && message.trim()
      ? `${message.trim()}\n\nShared post: ${postUrl}`
      : `Check out this post: ${postUrl}`;

    let sentCount = 0;

    for (const recipientId of recipientIds) {
      if (recipientId === user.id) continue;

      // Ensure the recipient is an accepted connection
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
        update: {
          lastMessage: shareMessageContent,
          lastMessageAt: new Date(),
        },
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
            content: `${user.name || "Someone"} shared a post with you`,
            link: `/messages/${user.id}`,
          },
        });
      } catch (notifErr) {
        console.error("Failed to create share notification:", notifErr);
      }

      sentCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Post shared successfully with ${sentCount} connection${sentCount === 1 ? "" : "s"}.`,
      data: { sentCount },
    });
  } catch (err: any) {
    console.error("Share post error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to share post." },
      { status: 500 }
    );
  }
}

