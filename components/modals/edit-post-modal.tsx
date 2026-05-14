"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Image as ImageIcon, Video, FileText } from "lucide-react";
import { toast } from "sonner";

export default function EditPostModal({ post, onClose, onSuccess }: any) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState(post.content || "");
  const [existingMedia, setExistingMedia] = useState<any[]>(post.media || []);
  const [deletedMediaIds, setDeletedMediaIds] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<{ url: string; type: string }[]>([]);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  const handleRemoveExistingMedia = (mediaId: string) => {
    setDeletedMediaIds((prev) => [...prev, mediaId]);
    setExistingMedia((prev) => prev.filter((m) => m.id !== mediaId));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, expectedType: "IMAGE" | "VIDEO" | "DOCUMENT") => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles: File[] = [];
    const previews: { url: string; type: string }[] = [];

    for (const file of files) {
      // Strict PDF validation for documents
      if (expectedType === "DOCUMENT" && file.type !== "application/pdf") {
        toast.error(`"${file.name}" is not supported. Only PDF files are allowed for documents.`);
        continue;
      }
      
      validFiles.push(file);
      previews.push({
        url: URL.createObjectURL(file),
        type: expectedType === "DOCUMENT" ? "DOCUMENT" : file.type // Normalize document type
      });
    }

    if (validFiles.length > 0) {
      setNewFiles((prev) => [...prev, ...validFiles]);
      setNewPreviews((prev) => [...prev, ...previews]);
    }
    
    // Reset the input so the user can select the same file again if they deleted it
    e.target.value = ""; 
  };

  const handleRemoveNewMedia = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => {
      URL.revokeObjectURL(prev[index].url); // Memory cleanup
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!content.trim() && existingMedia.length === 0 && newFiles.length === 0) {
      return toast.error("Post cannot be completely empty.");
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("content", content);
    formData.append("deletedMediaIds", JSON.stringify(deletedMediaIds));
    
    newFiles.forEach((file) => formData.append("newMedia", file));

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Post updated successfully");
        
        const tempNewMediaObjects = newPreviews.map(p => ({
          id: `temp-${Math.random()}`, 
          url: p.url, 
          type: p.type.startsWith("image") ? "IMAGE" : p.type.startsWith("video") ? "VIDEO" : "DOCUMENT"
        }));

        // Send merged media back to FeedCard
        onSuccess(content, [...existingMedia, ...tempNewMediaObjects]); 
      } else {
        toast.error(data.message || "Failed to update post");
      }
    } catch {
      toast.error("An error occurred while updating.");
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl flex flex-col max-h-[90vh] p-6 sm:p-8 animate-in zoom-in-95 duration-200">
        
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#050a30]">Edit Your Post</h2>
            <p className="text-sm text-slate-400 mt-1">Update your shared achievements, milestones, and business progress</p>
          </div>
          <button onClick={onClose} disabled={loading} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition">
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 border border-slate-200 rounded-[24px] p-5 flex flex-col flex-1 overflow-y-auto custom-scrollbar gap-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your achievement..."
            className="w-full resize-none outline-none text-slate-700 min-h-[120px] placeholder:text-slate-400 text-sm leading-relaxed bg-transparent"
          />

          {(existingMedia.length > 0 || newPreviews.length > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {/* Existing Media */}
              {existingMedia.map((m) => (
                <div key={m.id} className="relative aspect-square rounded-2xl border border-slate-100 overflow-hidden group bg-slate-50">
                  {m.type === "IMAGE" ? (
                    <img src={m.url} className="w-full h-full object-cover" alt="Media" />
                  ) : m.type === "VIDEO" ? (
                    <video src={m.url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <FileText size={28} />
                      <span className="text-[10px] mt-2 font-medium uppercase tracking-wide">PDF Document</span>
                    </div>
                  )}
                  <button onClick={() => handleRemoveExistingMedia(m.id)} className="absolute top-2 right-2 bg-slate-900/60 hover:bg-red-500 text-white p-1.5 rounded-full transition opacity-0 group-hover:opacity-100">
                    <X size={14} />
                  </button>
                </div>
              ))}

              {/* New Media */}
              {newPreviews.map((m, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl border border-blue-100 overflow-hidden group bg-blue-50">
                  {m.type.startsWith("image/") ? (
                    <img src={m.url} className="w-full h-full object-cover" alt="New Media" />
                  ) : m.type.startsWith("video/") ? (
                    <video src={m.url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-blue-400">
                      <FileText size={28} />
                      <span className="text-[10px] mt-2 font-medium uppercase tracking-wide">New PDF</span>
                    </div>
                  )}
                  <button onClick={() => handleRemoveNewMedia(idx)} className="absolute top-2 right-2 bg-slate-900/60 hover:bg-red-500 text-white p-1.5 rounded-full transition opacity-0 group-hover:opacity-100">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* STRICT FILE TYPE INPUTS */}
            <input type="file" accept="video/*" multiple className="hidden" ref={videoInputRef} onChange={(e) => handleFileChange(e, "VIDEO")} />
            <input type="file" accept="image/*" multiple className="hidden" ref={imageInputRef} onChange={(e) => handleFileChange(e, "IMAGE")} />
            <input type="file" accept="application/pdf" multiple className="hidden" ref={docInputRef} onChange={(e) => handleFileChange(e, "DOCUMENT")} />
            
            <button type="button" onClick={() => videoInputRef.current?.click()} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
              <Video size={16} /> Video
            </button>
            <button type="button" onClick={() => imageInputRef.current?.click()} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
              <ImageIcon size={16} /> Image
            </button>
            <button type="button" onClick={() => docInputRef.current?.click()} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
              <FileText size={16} /> Documents
            </button>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button onClick={onClose} disabled={loading} className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-full transition">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading} className="flex justify-center items-center gap-2 px-8 py-2.5 bg-[#8b9dfc] hover:bg-[#7286fa] text-white text-sm font-bold rounded-full transition disabled:opacity-50 shadow-sm">
              {loading && <Loader2 size={16} className="animate-spin" />} Save
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}