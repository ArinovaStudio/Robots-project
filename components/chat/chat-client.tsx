"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { redirect } from "next/navigation";
import { globalSocket } from "@/components/SocketAnnouncer";
import ChatHeader from "./chat-header";
import MessageList from "./message-list";
import ChatInput from "./chat-input";

interface ChatClientProps {
  currentUserId: string;
  targetUserId: string;
}

export default function ChatClient({ currentUserId, targetUserId }: ChatClientProps) {
  const [loading, setLoading] = useState(true);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const res = await fetch(`/api/chat/${targetUserId}?page=1&limit=50`);
        const json = await res.json();
        if (json.success) {
          setTargetUser(json.data.targetUser);
          setMessages(json.data.messages);
        } else {
          toast.error(json.message || "Failed to load chat.");
          redirect("/profile/connections");
        }
      } catch {
        toast.error("An error occurred while loading the chat.");
        redirect("/profile/connections");
      } finally {
        setLoading(false);
      }
    };
    fetchChatData();
  }, [targetUserId]);

  useEffect(() => {
    globalSocket.emit("join_dm", { currentUserId, targetUserId });
    globalSocket.emit("check_user_status", targetUserId);

    const handleStatusResult = (data: { userId: string; isOnline: boolean }) => {
      if (data.userId === targetUserId) setIsOnline(data.isOnline);
    };

    const handleStatusChange = (data: { userId: string; isOnline: boolean }) => {
      if (data.userId === targetUserId) setIsOnline(data.isOnline);
    };

    const handleReceive = (newMessage: any) => {
      setMessages((prev) => {
        if (prev.some(m => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });

      if (newMessage.senderId === targetUserId) {
        globalSocket.emit("mark_dm_read", { messageId: newMessage.id, readerId: currentUserId });
      }
    };

    const handleEdited = (updatedMessage: any) => {
      setMessages((prev) => prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg)));
    };

    const handleDeleted = (deletedMessage: any) => {
      setMessages((prev) => 
        prev.map((msg) => (msg.id === deletedMessage.id ? deletedMessage : msg))
      );
    };

    const handleReadReceipt = (data: { messageId: string }) => {
      setMessages((prev) => prev.map((msg) => (msg.id === data.messageId ? { ...msg, isRead: true } : msg)));
    };

    const handleError = (data: { message: string }) => toast.error(data.message);

    // Attach Listeners
    globalSocket.on("user_status_result", handleStatusResult);
    globalSocket.on("user_status_change", handleStatusChange);
    globalSocket.on("receive_dm", handleReceive);
    globalSocket.on("dm_edited", handleEdited);
    globalSocket.on("dm_deleted", handleDeleted);
    globalSocket.on("dm_read_receipt", handleReadReceipt);
    globalSocket.on("dm_error", handleError);

    // Cleanup
    return () => {
      globalSocket.off("user_status_result", handleStatusResult);
      globalSocket.off("user_status_change", handleStatusChange);
      globalSocket.off("receive_dm", handleReceive);
      globalSocket.off("dm_edited", handleEdited);
      globalSocket.off("dm_deleted", handleDeleted);
      globalSocket.off("dm_read_receipt", handleReadReceipt);
      globalSocket.off("dm_error", handleError);
    };
  }, [currentUserId, targetUserId]);

  const handleSendMessage = (text: string) => {
    globalSocket.emit("send_dm", {
      senderId: currentUserId,
      receiverId: targetUserId,
      content: text,
    });
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-120px)] items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-[#5667ff]" />
      </div>
    );
  }

  if (!targetUser) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <ChatHeader user={targetUser} isOnline={isOnline} />
      <MessageList messages={messages} currentUserId={currentUserId} onEditInit={(msg) => setEditingMessage(msg)} />
      <ChatInput 
        currentUserId={currentUserId}
        targetUserId={targetUserId}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
        onSendMessage={handleSendMessage} 
      />
    </div>
  );
}