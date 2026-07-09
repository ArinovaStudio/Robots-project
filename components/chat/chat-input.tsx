import { useState, useEffect, useRef } from "react";
import { Send, X, Edit2 } from "lucide-react";
import { globalSocket } from "@/components/SocketAnnouncer";

interface ChatInputProps {
  currentUserId: string;
  targetUserId: string; 
  editingMessage: any | null;
  onCancelEdit: () => void;
  onSendMessage: (text: string) => void;
}

export default function ChatInput({ currentUserId, targetUserId, editingMessage, onCancelEdit, onSendMessage }: ChatInputProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingMessage && !editingMessage.isDeleted) {
      setText(editingMessage.content);
      inputRef.current?.focus();
    } else {
      setText("");
    }
  }, [editingMessage]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (editingMessage) {
      globalSocket.emit("edit_dm", {
        messageId: editingMessage.id,
        senderId: currentUserId,
        content: text.trim(),
      });
      onCancelEdit(); 
    } else {
      onSendMessage(text.trim());
    }

    setText(""); 
  };

  return (
    <div className="border-t border-slate-100 bg-white p-4 shrink-0">
      
      {/* Edit Mode Alert Banner */}
      {editingMessage && (
        <div className="flex items-center justify-between mb-3 px-4 py-2 bg-indigo-50/50 rounded-xl border border-indigo-100/50 text-sm">
          <div className="flex items-center gap-2 text-indigo-600 font-medium">
            <Edit2 size={14} /><span>Editing message</span>
          </div>
          <button 
            onClick={() => { onCancelEdit(); setText(""); }} 
            className="p-1 hover:bg-indigo-100 rounded-full text-indigo-400 hover:text-indigo-600 transition"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex items-center gap-3">
        <input 
          ref={inputRef} 
          type="text" 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder={editingMessage ? "Edit your message..." : "Type a message..."} 
          className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-6 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#5667ff]/20 focus:border-[#5667ff] transition-all" 
        />
        <button 
          type="submit" 
          disabled={!text.trim()} 
          className={`flex items-center justify-center size-12 rounded-full transition shadow-sm ${text.trim() ? "bg-[#5667ff] text-white hover:bg-[#4352cc]" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
        >
          <Send size={18} className={text.trim() ? "ml-0.5" : ""} />
        </button>
      </form>
    </div>
  );
}