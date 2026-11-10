"use client";

import { useState, useEffect, useRef } from "react";
import { Send, X, Edit2, ImagePlus, Loader2, FileText, Video, Image as ImageIcon } from "lucide-react";
import { globalSocket } from "@/components/SocketAnnouncer";
import { toast } from "sonner";

interface ChatInputProps {
  currentUserId: string;
  targetUserId: string; 
  editingMessage: any | null;
  onCancelEdit: () => void;
  onSendMessage: (text: string, media?: { url: string; type: "IMAGE" | "VIDEO" | "PDF" }) => Promise<void>;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ChatInput({ currentUserId, targetUserId, editingMessage, onCancelEdit, onSendMessage }: ChatInputProps) {
  const [text, setText] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!mediaFile) {
      setPreviewUrl(null);
      return;
    }
    if (mediaFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(mediaFile);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    setPreviewUrl(null);
  }, [mediaFile]);

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
    if ((!text.trim() && !mediaFile) || sending) return;

    if (editingMessage) {
      if (!text.trim()) return;
      globalSocket.emit("edit_dm", {
        messageId: editingMessage.id,
        senderId: currentUserId,
        content: text.trim(),
      });
      onCancelEdit(); 
      setText("");
    } else {
      void sendMessage();
    }
  };

  const sendMessage = async () => {
    setSending(true);
    try {
      let media: { url: string; type: "IMAGE" | "VIDEO" | "PDF" } | undefined;
      if (mediaFile) {
        const formData = new FormData();
        formData.append("media", mediaFile);
        const response = await fetch(`/api/chat/${targetUserId}/media`, {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to upload media.");
        }
        media = result.data;
      }

      await onSendMessage(text.trim(), media);
      setText("");
      setMediaFile(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isVideo && !isPdf) {
      toast.error("Choose an image, video, or PDF file.");
      return;
    }
    const maxSize = isVideo ? 200 * 1024 * 1024 : isImage ? 40 * 1024 * 1024 : 120 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(
        isVideo
          ? "Videos must be 200 MB or smaller."
          : isImage
            ? "Images must be 40 MB or smaller."
            : "PDFs must be 120 MB or smaller.",
      );
      return;
    }
    setMediaFile(file);
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

      {/* Media Attachment Preview (Above text box, matching reference image) */}
      {mediaFile && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-xs transition-all">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Media presence thumbnail / icon */}
            <div className="relative h-11 w-14 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={mediaFile.name}
                  className="h-full w-full object-cover"
                />
              ) : mediaFile.type === "application/pdf" ? (
                <FileText className="h-5 w-5 text-red-500" />
              ) : mediaFile.type.startsWith("video/") ? (
                <Video className="h-5 w-5 text-blue-500" />
              ) : (
                <ImageIcon className="h-5 w-5 text-slate-500" />
              )}
            </div>

            {/* Media Details: Name + Size, and 'Attached' */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {mediaFile.name}{" "}
                <span className="text-slate-400 font-normal">• {formatFileSize(mediaFile.size)}</span>
              </p>
              <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                Attached
              </p>
            </div>
          </div>

          {/* Remove attachment button */}
          <button
            type="button"
            onClick={() => setMediaFile(null)}
            disabled={sending}
            aria-label="Remove attachment"
            className="ml-3 shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          disabled={sending || !!editingMessage}
        />
        {!editingMessage && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            aria-label="Attach image, video, or PDF"
            title="Attach image, video, or PDF"
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 disabled:opacity-50"
          >
            <ImagePlus size={20} />
          </button>
        )}
        <input 
          ref={inputRef} 
          type="text" 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder={editingMessage ? "Edit your message..." : mediaFile ? "Add a caption..." : "Type a message..."}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-6 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all" 
        />
        <button 
          type="submit" 
          disabled={(!text.trim() && !mediaFile) || sending}
          className={`flex items-center justify-center size-12 rounded-full transition shadow-sm ${text.trim() || mediaFile ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className={text.trim() || mediaFile ? "ml-0.5" : ""} />}
        </button>
      </form>
    </div>
  );
}