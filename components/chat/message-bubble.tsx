import { useState, useRef, useEffect } from "react";
import { MoreVertical, Edit2, Trash2, Check, CheckCheck, Ban, FileText } from "lucide-react";
import Image from "next/image";
import { globalSocket } from "@/components/SocketAnnouncer";

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  onEditInit: (message: any) => void;
}

export default function MessageBubble({ message, isOwn, onEditInit }: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this message for everyone?")) {
      globalSocket.emit("delete_dm", {
        messageId: message.id,
        senderId: message.senderId,
      });
      setShowMenu(false);
    }
  };

  const handleEdit = () => {
    onEditInit(message);
    setShowMenu(false);
  };

  const timeString = new Date(message.createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`flex w-full ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
        
        {/* Avatar for the sender */}
        {!isOwn && (
          <div className="size-8 rounded-xl overflow-hidden bg-white border border-slate-200 shrink-0 relative mt-auto">
            {message.sender?.image || message.sender?.company?.logoUrl ? (
              <Image src={message.sender.image || message.sender.company.logoUrl} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-xs text-slate-400 bg-slate-100">
                {message.sender?.name?.charAt(0) || "?"}
              </div>
            )}
          </div>
        )}

        {/* Bubble Container */}
        <div className={`relative group flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
          
          <div className="flex items-center gap-2">
            {/* Actions Dropdown */}
            {isOwn && !message.isDeleted && (
              <div className="relative opacity-0 group-hover:opacity-100 transition-opacity" ref={menuRef}>
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <MoreVertical size={16} />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-8 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20">
                    <button 
                      onClick={handleEdit}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button 
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* The Actual Bubble */}
            <div 
              className={`px-4 py-2.5 rounded-[20px] text-[15px] leading-relaxed shadow-sm ${
                message.isDeleted
                  ? "bg-slate-100 text-slate-500 italic border border-slate-200" 
                  : isOwn 
                    ? "bg-blue-600 text-white rounded-br-[4px]" 
                    : "bg-white text-slate-800 border border-slate-100 rounded-bl-[4px]"
              }`}
            >
              {message.isDeleted ? (
                <div className="flex items-center gap-1.5 text-sm">
                  <Ban size={14} className="opacity-70" />
                  This message was deleted
                </div>
              ) : (
                <div className="space-y-2">
                  {message.mediaUrl && message.mediaType === "IMAGE" && (
                    <a href={message.mediaUrl} target="_blank" rel="noreferrer">
                      <Image
                        src={message.mediaUrl}
                        alt="Shared photo"
                        width={480}
                        height={320}
                        unoptimized
                        className="h-auto max-h-80 max-w-full rounded-xl object-contain"
                      />
                    </a>
                  )}
                  {message.mediaUrl && message.mediaType === "VIDEO" && (
                    <video
                      src={message.mediaUrl}
                      controls
                      preload="metadata"
                      className="max-h-80 max-w-full rounded-xl"
                    >
                      Your browser does not support video playback.
                    </video>
                  )}
                  {message.mediaUrl && message.mediaType === "PDF" && (
                    <a
                      href={message.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                    >
                      <FileText size={18} />
                      Open PDF
                    </a>
                  )}
                  {message.content && (
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Time & Read Receipts */}
          <div className={`flex items-center gap-1.5 mt-1 mx-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
            <span className="text-[11px] font-medium text-slate-400">
              {timeString}
            </span>
            
            {message.isEdited && !message.isDeleted && (
              <span className="text-[11px] font-medium text-slate-400 italic">(Edited)</span>
            )}

            {isOwn && !message.isDeleted && (
              <span className="text-slate-400">
                {message.isPending ? (
                  <Check size={14} className="opacity-70" />
                ) : message.isRead ? (
                  <CheckCheck size={14} className="text-blue-600" /> 
                ) : (
                  <CheckCheck size={14} />
                )}
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}