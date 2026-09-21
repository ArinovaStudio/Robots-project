"use client";

import { useState, useRef, useEffect } from "react";
import { FileText, ImageIcon, Video, X, Loader2, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CreateEventModal from "@/components/modals/create-event-modal";
import { useUserStore } from "@/store/AuthStore";

type MediaPreview = {
  file: File;
  previewUrl: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT";
};

export default function CreatePostModal({
  isOpen,
  onClose,
  initialType,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialType?: "IMAGE" | "VIDEO" | "DOCUMENT" | "EVENT" | null;
}) {
  const router = useRouter();
  const { user } = useUserStore();
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<MediaPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventData, setEventData] = useState<{ title: string; date: string; time: string; location: string; link: string } | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && initialType) {
      if (initialType === "IMAGE") imageInputRef.current?.click();
      if (initialType === "VIDEO") videoInputRef.current?.click();
      if (initialType === "DOCUMENT") docInputRef.current?.click();
      if (initialType === "EVENT") setIsEventModalOpen(true);
    }
  }, [isOpen, initialType]);

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

  const handleClose = () => {
    setContent("");
    setEventData(null);
    setError("");
    media.forEach((m) => URL.revokeObjectURL(m.previewUrl));
    setMedia([]);
    onClose();
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
        handleClose();
        router.refresh();
        window.location.reload();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all duration-300">
        <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Create a post</h2>
            <button onClick={handleClose} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 font-medium">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0">
                {user?.image ? (
                  <Image src={user.image} alt="Profile" width={48} height={48} className="object-cover h-full w-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-lg">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{user?.name || "Member"}</h3>
                <p className="text-xs text-gray-500">Post to anyone</p>
              </div>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What do you want to talk about?"
              autoFocus
              className="w-full resize-none bg-transparent text-[15px] text-gray-900 outline-none placeholder:text-gray-500 min-h-[120px]"
            />

            {/* Event Details Preview */}
            {eventData && (
              <div className="mb-4">
                <div className="relative group p-4 rounded-lg border border-orange-200 bg-orange-50 flex items-start gap-3">
                  <button
                    onClick={() => setEventData(null)}
                    className="absolute top-2 right-2 p-1.5 bg-white text-gray-400 hover:text-red-500 shadow-sm rounded-full transition"
                  >
                    <X size={14} />
                  </button>
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-md shrink-0">
                    <CalendarDays size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{eventData.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(`${eventData.date}T${eventData.time}`).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                    {eventData.location && <p className="text-xs text-gray-500 mt-0.5">{eventData.location}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Media Previews Container */}
            {media.length > 0 && (
              <div className={`mt-2 grid gap-2 ${media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {media.map((item, index) => (
                  <div key={index} className="relative group rounded-lg border border-gray-200 overflow-hidden bg-gray-50 aspect-video flex-shrink-0">
                    <button
                      onClick={() => removeMedia(index)}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-black/60 text-white shadow-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                    >
                      <X size={14} />
                    </button>
                    {item.type === "IMAGE" && <img src={item.previewUrl} alt="preview" className="h-full w-full object-cover" />}
                    {item.type === "VIDEO" && <video src={item.previewUrl} className="h-full w-full object-cover" />}
                    {item.type === "DOCUMENT" && (
                      <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-gray-500">
                        <FileText size={32} className="mb-2 text-blue-500" />
                        <span className="text-xs truncate w-full px-2">{item.file.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hidden File Inputs */}
          <input type="file" multiple accept="image/*" className="hidden" ref={imageInputRef} onChange={(e) => handleFileChange(e, "IMAGE")} />
          <input type="file" multiple accept="video/*" className="hidden" ref={videoInputRef} onChange={(e) => handleFileChange(e, "VIDEO")} />
          <input type="file" multiple accept="application/pdf" className="hidden" ref={docInputRef} onChange={(e) => handleFileChange(e, "DOCUMENT")} />

          {/* Footer Actions */}
          <div className="px-5 py-4 flex items-center justify-between border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-1">
              <ActionButton icon={<ImageIcon className="w-5 h-5" />} tooltip="Add Photo" onClick={() => imageInputRef.current?.click()} disabled={loading} color="text-blue-500" />
              <ActionButton icon={<Video className="w-5 h-5" />} tooltip="Add Video" onClick={() => videoInputRef.current?.click()} disabled={loading} color="text-green-600" />
              <ActionButton icon={<CalendarDays className="w-5 h-5" />} tooltip="Create Event" onClick={() => setIsEventModalOpen(true)} disabled={loading || !!eventData} color="text-orange-500" />
              <ActionButton icon={<FileText className="w-5 h-5" />} tooltip="Add Document" onClick={() => docInputRef.current?.click()} disabled={loading} color="text-red-500" />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || (!content.trim() && media.length === 0)}
              className="flex items-center justify-center px-6 py-2.5 rounded-full bg-blue-600 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Post"}
            </button>
          </div>
        </div>
      </div>

      <CreateEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSubmit={(data) => setEventData(data)}
      />
    </>
  );
}

function ActionButton({
  icon,
  tooltip,
  onClick,
  disabled,
  color,
}: {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      title={tooltip}
      className={`p-2.5 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${color}`}
    >
      {icon}
    </button>
  );
}
