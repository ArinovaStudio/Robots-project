"use client";

import { useState, useRef } from "react";
import { FileText, ImageIcon, Video, X, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";

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
        media.forEach(m => URL.revokeObjectURL(m.previewUrl));
        setMedia([]);
        router.refresh(); 
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Post Your Achievements
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Share updates, milestones, and business progress
        </p>
      </div>

      {error && (
        <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* Textarea */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type your achievement..."
        className="
          mt-5 h-28 w-full resize-none rounded-2xl border
          border-slate-200 bg-[#f8fafc] p-4 text-sm
          text-slate-700 outline-none transition-all
          placeholder:text-slate-400
          focus:border-slate-300 focus:bg-white
        "
      />

      {/* Media Previews Container */}
      {media.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {media.map((item, index) => (
            <div key={index} className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-50 h-24 w-24 flex-shrink-0">
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
                <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center text-slate-500">
                  <FileText size={24} className="mb-1 text-blue-500" />
                  <span className="text-[10px] truncate w-full">{item.file.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions & Submit */}
      <div className="mt-5 flex items-center justify-between gap-3">
        {/* Hidden File Inputs */}
        <input type="file" multiple accept="image/*" className="hidden" ref={imageInputRef} onChange={(e) => handleFileChange(e, "IMAGE")} />
        <input type="file" multiple accept="video/*" className="hidden" ref={videoInputRef} onChange={(e) => handleFileChange(e, "VIDEO")} />
        <input type="file" multiple accept="application/pdf" className="hidden" ref={docInputRef} onChange={(e) => handleFileChange(e, "DOCUMENT")} />

        <div className="flex items-center gap-2 flex-1">
          <Action icon={<Video size={16} />} label="Video" onClick={() => videoInputRef.current?.click()} disabled={loading} />
          <Action icon={<ImageIcon size={16} />} label="Image" onClick={() => imageInputRef.current?.click()} disabled={loading} />
          <Action icon={<FileText size={16} />} label="Documents" onClick={() => docInputRef.current?.click()} disabled={loading} />
        </div>

        {/* Post Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || (!content.trim() && media.length === 0)}
          className="
            flex items-center justify-center gap-2 px-6 py-3
            rounded-xl bg-[#3F6FFF] text-sm font-semibold text-white
            transition-all hover:bg-[#345cdd] disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Post
        </button>
      </div>
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
        flex flex-1 items-center justify-center gap-2
        rounded-xl border border-slate-200
        bg-slate-50 px-4 py-3 text-sm font-medium
        text-slate-700 transition-all
        hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}