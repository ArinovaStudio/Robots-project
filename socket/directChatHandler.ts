import { Server, Socket } from "socket.io";
import { prisma } from "../lib/prisma";

const getRoomId = (id1: string, id2: string) => [id1, id2].sort().join("_");

export default function directChatHandler(io: Server, socket: Socket) {
  
  socket.on("join_dm", (data: { currentUserId: string; targetUserId: string }) => {
    const roomName = `dm_${getRoomId(data.currentUserId, data.targetUserId)}`;
    socket.join(roomName);
  });

  socket.on("send_dm", async (data: { senderId: string; receiverId: string; content: string }) => {
    // TODO: Verify senderId matches authenticated socket session to prevent spoofing
    try {
      if (!data.content || data.content.trim() === "") return;

      const connection = await prisma.connection.findFirst({
        where: {
          OR: [
            { senderId: data.senderId, receiverId: data.receiverId },
            { senderId: data.receiverId, receiverId: data.senderId }
          ],
          status: "ACCEPTED"
        }
      });

      if (!connection) {
        return socket.emit("dm_error", { message: "You can only chat with accepted connections." });
      }

      const [user1Id, user2Id] = [data.senderId, data.receiverId].sort();

      const conversation = await prisma.conversation.upsert({
        where: { user1Id_user2Id: { user1Id, user2Id } },
        update: { lastMessage: data.content, lastMessageAt: new Date() },
        create: { user1Id, user2Id, lastMessage: data.content, lastMessageAt: new Date() }
      });

      const savedMessage = await prisma.directMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: data.senderId,
          content: data.content
        },
        include: {
          sender: { select: { id: true, name: true, company: { select: { logoUrl: true, companyName: true } } } }
        }
      });

      const roomName = `dm_${getRoomId(data.senderId, data.receiverId)}`;
      io.to(roomName).emit("receive_dm", savedMessage);

      // Create Notification
      const notification = await prisma.notification.create({
        data: {
          userId: data.receiverId,
          actorId: data.senderId,
          type: "NEW_MESSAGE",
          content: `${savedMessage.sender.name || "Someone"} sent you a message`,
          link: `/messages/${data.senderId}`,
        }
      });

      // Emit to global room
      io.to(`user_${data.receiverId}`).emit("new_notification", notification);

    } catch {
      socket.emit("dm_error", { message: "Failed to send message." });
    }
  });

  socket.on("delete_dm", async (data: { messageId: string; senderId: string }) => {
    try {
      const existingMessage = await prisma.directMessage.findUnique({
        where: { id: data.messageId },
        include: { conversation: true }
      });

      if (!existingMessage || existingMessage.senderId !== data.senderId) {
        return socket.emit("dm_error", { message: "Cannot delete this message." });
      }

      const deletedMessage = await prisma.directMessage.update({
        where: { id: data.messageId },
        data: { content: "", isDeleted: true },
        include: {
          sender: { select: { id: true, name: true, company: { select: { logoUrl: true } } } }
        }
      });

      const roomName = `dm_${getRoomId(existingMessage.conversation.user1Id, existingMessage.conversation.user2Id)}`;
      io.to(roomName).emit("dm_deleted", deletedMessage);

    } catch {
      socket.emit("dm_error", { message: "Failed to delete message." });
    }
  });

  socket.on("edit_dm", async (data: { messageId: string; senderId: string; content: string }) => {
    try {
      const existingMessage = await prisma.directMessage.findUnique({
        where: { id: data.messageId },
        include: { conversation: true }
      });

      if (!existingMessage || existingMessage.senderId !== data.senderId) return;

      const updatedMessage = await prisma.directMessage.update({
        where: { id: data.messageId },
        data: { content: data.content, isEdited: true },
        include: {
          sender: { select: { id: true, name: true, company: { select: { logoUrl: true } } } }
        }
      });

      const roomName = `dm_${getRoomId(existingMessage.conversation.user1Id, existingMessage.conversation.user2Id)}`;
      io.to(roomName).emit("dm_edited", updatedMessage);

    } catch {
      socket.emit("dm_error", { message: "Failed to edit message." });
    }
  });

  socket.on("mark_dm_read", async (data: { messageId: string; readerId: string }) => {
    try {
      const msg = await prisma.directMessage.findUnique({
        where: { id: data.messageId },
        include: { conversation: true }
      });
      
      if (!msg || msg.senderId === data.readerId) return;

      await prisma.directMessage.update({
        where: { id: data.messageId },
        data: { isRead: true }
      });

      const roomName = `dm_${getRoomId(msg.conversation.user1Id, msg.conversation.user2Id)}`;
      io.to(roomName).emit("dm_read_receipt", { messageId: data.messageId });
    } catch {}
  });
}