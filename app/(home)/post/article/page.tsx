"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Loader2, X, ArrowLeft } from "lucide-react";

export default function WriteArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState<{ file: File; preview: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const finalContent = `# ${title}\n\n${content}`;
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
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Write an Article</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !content.trim()}
            className="flex items-center justify-center px-6 py-2 rounded-full bg-blue-600 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish"}
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {!coverImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-gray-600 font-medium">Add a cover image</span>
                <span className="text-sm text-gray-400 mt-1">Recommended size: 1200 x 630 pixels</span>
              </div>
            ) : (
              <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200 group">
                <img src={coverImage.preview} alt="Cover" className="w-full h-full object-cover" />
                <button
                  onClick={removeImage}
                  className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article Title"
              className="w-full text-4xl font-bold text-gray-900 placeholder:text-gray-300 border-none outline-none focus:ring-0 px-0 bg-transparent"
            />

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your article here..."
              className="w-full min-h-[400px] text-lg text-gray-700 placeholder:text-gray-400 border-none outline-none focus:ring-0 px-0 bg-transparent resize-none leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
