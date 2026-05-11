import { Server, Socket } from "socket.io";
import { prisma } from "../lib/prisma";

const getRoomId = (userId1: string, userId2: string) => {
  return [userId1, userId2].sort().join("_");
};

export default function registerDirectChatHandlers(io: Server, socket: Socket) {
  
  socket.on("join_dm", (data: { currentUserId: string; targetUserId: string }) => {
    try {
      const roomName = `dm_${getRoomId(data.currentUserId, data.targetUserId)}`;
      socket.join(roomName);
    } catch {
      socket.emit("dm_error", { message: "Failed to join direct message chat" });
    }
  });

  socket.on("send_dm", async (data: { senderId: string; receiverId: string; content: string }) => {
    try {
      if (!data.content || data.content.trim() === "") {
        return socket.emit("dm_error", { message: "Message cannot be empty." });
      }

      const connection = await prisma.connection.findFirst({
        where: {
          OR: [ { senderId: data.senderId, receiverId: data.receiverId },
                { senderId: data.receiverId, receiverId: data.senderId } ],
          status: "ACCEPTED"
        }
      });

      if (!connection) {
        return socket.emit("dm_error", { message: "You can only send messages to your connections." });
      }

      const [user1Id, user2Id] = [data.senderId, data.receiverId].sort();

      const conversation = await prisma.conversation.upsert({
        where: { user1Id_user2Id: { user1Id, user2Id }},
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

    } catch {
      socket.emit("dm_error", { message: "Failed to send message" });
    }
  });

  socket.on("edit_dm", async (data: { messageId: string; senderId: string; content: string }) => {
    try {
      if (!data.content || data.content.trim() === "") {
        return socket.emit("dm_error", { message: "Message cannot be empty." });
      }

      const existingMessage = await prisma.directMessage.findUnique({ 
        where: { id: data.messageId },
        include: { conversation: true } 
      });
      
      if (!existingMessage){
        return socket.emit("dm_error", { message: "Message not found" });
      }

      if (existingMessage.senderId !== data.senderId) {
        return socket.emit("dm_error", { message: "You can only edit your own messages" });
      }

      const updatedMessage = await prisma.directMessage.update({
        where: { id: data.messageId },
        data: { content: data.content, isEdited: true },
        include: { 
          sender: { select: { id: true, name: true, company: { select: { logoUrl: true, companyName: true } } } } 
        }
      });

      const latestMessage = await prisma.directMessage.findFirst({
        where: { conversationId: existingMessage.conversationId },
        orderBy: { createdAt: 'desc' }, 
        select: { id: true }
      });

      if (latestMessage && latestMessage.id === data.messageId) {
        await prisma.conversation.update({
          where: { id: existingMessage.conversationId },
          data: { lastMessage: data.content }
        });
      }

      const roomName = `dm_${getRoomId(existingMessage.conversation.user1Id, existingMessage.conversation.user2Id)}`;
      io.to(roomName).emit("dm_edited", updatedMessage);
    } catch {
      socket.emit("dm_error", { message: "Failed to edit message" });
    }
  });


  socket.on("delete_dm", async (data: { messageId: string; senderId: string }) => {
    try {
      const existingMessage = await prisma.directMessage.findUnique({ 
        where: { id: data.messageId },
        include: { conversation: true }
      });
      
      if (!existingMessage){
        return socket.emit("dm_error", { message: "Message not found" });
      }

      if (existingMessage.senderId !== data.senderId) {
        return socket.emit("dm_error", { message: "You can only delete your own messages" });
      }

      await prisma.directMessage.delete({ where: { id: data.messageId } });

      const newLatestMessage = await prisma.directMessage.findFirst({
        where: { conversationId: existingMessage.conversationId },
        orderBy: { createdAt: 'desc' }
      });

      await prisma.conversation.update({
        where: { id: existingMessage.conversationId },
        data: { 
          lastMessage: newLatestMessage ? newLatestMessage.content : null,
          lastMessageAt: newLatestMessage ? newLatestMessage.createdAt : existingMessage.conversation.createdAt
        }
      });

      const roomName = `dm_${getRoomId(existingMessage.conversation.user1Id, existingMessage.conversation.user2Id)}`;
      io.to(roomName).emit("dm_deleted", { messageId: data.messageId });

    } catch {
      socket.emit("dm_error", { message: "Failed to delete message" });
    }
  });

  socket.on("mark_dm_read", async (data: { messageId: string; readerId: string }) => {
    try {
      const existingMessage = await prisma.directMessage.findUnique({ 
        where: { id: data.messageId },
        include: { conversation: true }
      });

      if (existingMessage && existingMessage.senderId !== data.readerId && !existingMessage.isRead) {
        
        await prisma.directMessage.update({ where: { id: data.messageId }, data: { isRead: true } });

        const roomName = `dm_${getRoomId(existingMessage.conversation.user1Id, existingMessage.conversation.user2Id)}`;
        io.to(roomName).emit("dm_read_receipt", { messageId: data.messageId });
      }
    } catch {
      socket.emit("dm_error", { message: "Failed to mark message as read" });
    }
  });
}