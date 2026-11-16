"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Loader2, X, ArrowLeft } from "lucide-react";

const TITLE_MAX = 150;
export default function WriteArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState<{ file: File; preview: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Why Publish is disabled (empty string = enabled)
  const disabledReason = loading
    ? "Publishing..."
    : !title.trim() && !content.trim()
    ? "Add a title and some text to publish"
    : !title.trim()
    ? "Add a title to publish"
    : !content.trim()
    ? "Write your article to publish"
    : "";
  const canPublish = disabledReason === "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setCoverImage({
        file,
        preview: URL.createObjectURL(file),
      });
    }
  };

  const removeImage = () => {
    if (coverImage) {
      URL.revokeObjectURL(coverImage.preview);
      setCoverImage(null);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    const finalContent = `# ${title.trim()}\n\n${content}`;
    formData.append("content", finalContent);

    if (coverImage) {
      formData.append("media", coverImage.file);
    }

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.message || "Failed to publish article");
      } else {
        router.push("/explore");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full pb-16">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Write an Article</h1>
          </div>

          <div className="flex items-center gap-3">
            {!canPublish && !loading && (
              <span className="hidden sm:inline text-xs text-gray-500">{disabledReason}</span>
            )}
            <button
              onClick={handleSubmit}
              disabled={!canPublish}
              title={disabledReason || "Publish article"}
              className="flex items-center justify-center px-6 py-2 rounded-full bg-blue-600 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish"}
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Cover image (optional) */}
            {!coverImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <ImageIcon className="w-7 h-7 text-gray-400 mb-2" />
                <span className="text-gray-600 font-medium">Add a cover image (optional)</span>
                <span className="text-sm text-gray-400 mt-1">Recommended size: 1200 x 630 pixels</span>
              </div>
            ) : (
              <div className="relative w-full h-64 rounded-xl overflow-hidden border border-gray-200 group">
                <img src={coverImage.preview} alt="Cover" className="w-full h-full object-cover" />
                <button
                  onClick={removeImage}
                  aria-label="Remove cover image"
                  className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="article-title" className="text-sm font-semibold text-gray-800">
                  Title <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-400">
                  {title.length}/{TITLE_MAX}
                </span>
              </div>
              <input
                id="article-title"
                type="text"
                value={title}
                maxLength={TITLE_MAX}
                autoFocus
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your article title"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-2xl font-bold text-gray-900 placeholder:font-medium placeholder:text-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="article-body" className="text-sm font-semibold text-gray-800">
                  Article <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-gray-400">
                  {content.trim() ? content.trim().split(/\s+/).length : 0} words
                </span>
              </div>
              <textarea
                id="article-body"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article here..."
                className="w-full min-h-[360px] rounded-xl border border-gray-300 bg-white px-4 py-3 text-lg leading-relaxed text-gray-800 placeholder:text-gray-400 outline-none resize-y transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}