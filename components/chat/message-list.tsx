import { useEffect, useRef } from "react";
import MessageBubble from "./message-bubble";

interface MessageListProps {
  messages: any[];
  currentUserId: string;
  onEditInit: (message: any) => void;
}

export default function MessageList({ messages, currentUserId, onEditInit }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    
    const lastMessage = messages[messages.length - 1];
    const isMyMessage = lastMessage?.senderId === currentUserId;

    if (isNearBottom || isMyMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, currentUserId]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-400">
          <p className="text-sm font-medium">No messages yet.</p>
        </div>
      ) : (
        messages.map((message) => (
          <MessageBubble key={message.id} message={message} isOwn={message.senderId === currentUserId} onEditInit={onEditInit} />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}