"use client";

import { useState, useRef } from "react";
import { FileText, ImageIcon, Video, X, Loader2, Send, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import CreateEventModal from "@/components/modals/create-event-modal";

type MediaPreview = {
  file: File;
  previewUrl: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT";
};

export default function AchievementPost() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<MediaPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventData, setEventData] = useState<{ title: string; date: string; time: string; location: string; link: string } | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "IMAGE" | "VIDEO" | "DOCUMENT") => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);

      if (type === "DOCUMENT") {
        const hasInvalidFiles = selectedFiles.some(file => file.type !== "application/pdf");
        if (hasInvalidFiles) {
          setError("Only PDF documents are allowed.");
          e.target.value = "";
          return;
        }
      }

      const newFiles = selectedFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file), 
        type,
      }));
      
      setMedia((prev) => [...prev, ...newFiles]);
      setIsExpanded(true);
    }
    e.target.value = ""; 
  };

  const removeMedia = (indexToRemove: number) => {
    setMedia((prev) => {
      const newMedia = [...prev];
      URL.revokeObjectURL(newMedia[indexToRemove].previewUrl);
      newMedia.splice(indexToRemove, 1);
      return newMedia;
    });
  };

  const handleSubmit = async () => {
    if (!content.trim() && media.length === 0) {
      return setError("Please add some text or media to post.");
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    if (content.trim()) {
      formData.append("content", content);
    }
    
    if (eventData) {
      formData.append("eventData", JSON.stringify(eventData));
    }
    
    media.forEach((item) => {
      formData.append("media", item.file);
    });

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.message || "Failed to create post");
      } else {
        setContent("");
        setEventData(null);
        media.forEach(m => URL.revokeObjectURL(m.previewUrl));
        setMedia([]);
        setIsExpanded(false);
        router.refresh(); 
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      {error && (
        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-3 mb-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0">
          <Image
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
            alt="Profile"
            width={48}
            height={48}
            className="object-cover"
          />
        </div>
        
        <div className="flex-1">
          {isExpanded ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What do you want to talk about?"
              autoFocus
              className="
                w-full resize-none rounded-lg border
                border-gray-300 bg-white p-3 text-sm
                text-gray-900 outline-none transition-all
                placeholder:text-gray-500 min-h-[100px]
                focus:border-blue-500 focus:ring-1 focus:ring-blue-500
              "
            />
          ) : (
            <button 
              onClick={() => setIsExpanded(true)}
              className="w-full text-left rounded-full border border-gray-300 px-4 py-3 text-gray-500 font-medium hover:bg-gray-50 transition-colors"
            >
              Start a post
            </button>
          )}
        </div>
      </div>

      {/* Event Details Preview */}
      {eventData && isExpanded && (
        <div className="mb-4 pl-[60px] pr-4">
          <div className="relative group p-3 rounded-lg border border-orange-200 bg-orange-50 flex items-start gap-3">
            <button
              onClick={() => setEventData(null)}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 rounded-full transition"
            >
              <X size={14} />
            </button>
            <div className="p-2 bg-orange-100 text-orange-600 rounded-md shrink-0">
              <CalendarDays size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">{eventData.title}</h4>
              <p className="text-xs text-gray-600 mt-1">
                {new Date(`${eventData.date}T${eventData.time}`).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
              {eventData.location && <p className="text-xs text-gray-500 mt-0.5">{eventData.location}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Media Previews Container */}
      {media.length > 0 && isExpanded && (
        <div className="mt-4 flex flex-wrap gap-3 pl-15">
          {media.map((item, index) => (
            <div key={index} className="relative group rounded-md border border-gray-200 overflow-hidden bg-gray-50 h-24 w-24 flex-shrink-0">
              {/* Remove Button */}
              <button
                onClick={() => removeMedia(index)}
                className="absolute top-1 right-1 z-10 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              >
                <X size={12} />
              </button>

              {/* Render based on type */}
              {item.type === "IMAGE" && (
                <img src={item.previewUrl} alt="preview" className="h-full w-full object-cover" />
              )}
              {item.type === "VIDEO" && (
                <video src={item.previewUrl} className="h-full w-full object-cover" />
              )}
              {item.type === "DOCUMENT" && (
                <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center text-gray-500">
                  <FileText size={24} className="mb-1 text-blue-500" />
                  <span className="text-[10px] truncate w-full">{item.file.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hidden File Inputs */}
      <input type="file" multiple accept="image/*" className="hidden" ref={imageInputRef} onChange={(e) => handleFileChange(e, "IMAGE")} />
      <input type="file" multiple accept="video/*" className="hidden" ref={videoInputRef} onChange={(e) => handleFileChange(e, "VIDEO")} />
      <input type="file" multiple accept="application/pdf" className="hidden" ref={docInputRef} onChange={(e) => handleFileChange(e, "DOCUMENT")} />

      {/* Actions */}
      <div className="flex justify-between items-center pt-2">
        <div className="flex gap-1 flex-1">
          <Action icon={<ImageIcon className="w-5 h-5 text-blue-500" />} label="Photo" onClick={() => imageInputRef.current?.click()} disabled={loading} />
          <Action icon={<Video className="w-5 h-5 text-green-600" />} label="Video" onClick={() => videoInputRef.current?.click()} disabled={loading} />
          <Action icon={<CalendarDays className="w-5 h-5 text-orange-500" />} label="Event" onClick={() => setIsEventModalOpen(true)} disabled={loading || !!eventData} />
          <Action icon={<FileText className="w-5 h-5 text-red-500" />} label="Write article" onClick={() => router.push("/post/article")} disabled={loading} />
        </div>
        
        {isExpanded && (
          <button
            onClick={handleSubmit}
            disabled={loading || (!content.trim() && media.length === 0)}
            className="
              flex items-center justify-center ml-2 px-4 py-2
              rounded-full bg-blue-600 text-sm font-semibold text-white
              transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Post"}
          </button>
        )}
      </div>

      <CreateEventModal 
        isOpen={isEventModalOpen} 
        onClose={() => setIsEventModalOpen(false)} 
        onSubmit={(data) => {
          setEventData(data);
          setIsExpanded(true);
        }} 
      />
    </div>
  );
}

function Action({
  icon,
  label,
  onClick,
  disabled
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className="
        flex items-center justify-center gap-2 px-2 py-3 hover:bg-gray-100 rounded-md transition-colors text-gray-600 font-medium text-sm flex-1 disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}