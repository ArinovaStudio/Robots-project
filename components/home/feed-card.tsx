"use client";

import { useState } from "react";
import { Bookmark, MessageCircle, MoreVertical, Share2, ThumbsUp, ThumbsDown, Flag } from "lucide-react";
import ShareModal from "../modals/share-modal";
import ReportModal from "../modals/report-modal";
import PostComments from "./post-comments";
import MediaSlider from "./media-slider";

export default function FeedCard({ post, currentUser }: { post: any, currentUser: any }) {
  const [reaction, setReaction] = useState<"LIKE" | "DISLIKE" | null>(post?.userReaction || null);
  const [likesCount, setLikesCount] = useState(post?.likesCount || 0);
  const [dislikesCount, setDislikesCount] = useState(post?.dislikesCount || 0);
  const [isSaved, setIsSaved] = useState(post?.isSaved || false);
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const authorName = post?.author?.company?.companyName || post?.author?.name || "Independent Professional";
  const authorInitials = authorName.charAt(0).toUpperCase();

  const handleReact = async (type: "LIKE" | "DISLIKE") => {
    if (reaction === type) {
      setReaction(null);
      if (type === "LIKE") setLikesCount((prev: any) => prev - 1);
      if (type === "DISLIKE") setDislikesCount((prev: any) => prev - 1);
    } else {
      if (reaction === "LIKE" && type === "DISLIKE") {
        setLikesCount((prev: any) => prev - 1);
        setDislikesCount((prev: any) => prev + 1);
      } else if (reaction === "DISLIKE" && type === "LIKE") {
        setDislikesCount((prev: any) => prev - 1);
        setLikesCount((prev: any) => prev + 1);
      } else if (!reaction) {
        if (type === "LIKE") setLikesCount((prev: any) => prev + 1);
        if (type === "DISLIKE") setDislikesCount((prev: any) => prev + 1);
      }
      setReaction(type);
    }

    try {
      await fetch(`/api/posts/${post.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
    } catch {
    }
  };

  const handleSave = async () => {
    setIsSaved(!isSaved);
    try {
      await fetch(`/api/posts/${post.id}/save`, { method: "POST" });
    } catch {
      setIsSaved(isSaved);
    }
  };

  if (!post) return null; 

  return (
    <div className="flex flex-col">
      <div className="bg-background p-4 rounded-2xl relative shadow-sm border border-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {post.author?.company?.logoUrl ? (
              <img src={post.author.company.logoUrl} className="h-10 w-10 rounded-full object-cover" alt="Logo" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF0FF] text-base font-bold text-[#5667ff]">
                {authorInitials}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold">{authorName}</h3>
              <p className="text-xs text-slate-400">
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="relative">
            <button onClick={() => setShowDropdown(!showDropdown)} className="text-slate-500">
              <MoreVertical size={18} />
            </button>
            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 top-6 w-36 bg-white border border-slate-200 shadow-md rounded-xl z-10 overflow-hidden">
                {currentUser?.id !== post.authorId && (
                  <button onClick={() => { setShowReport(true); setShowDropdown(false); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-slate-50">
                    <Flag size={14} /> Report
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600 whitespace-pre-wrap">
          {post.content}
        </div>
        
        <MediaSlider media={post.media} />
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => handleReact("LIKE")}
          className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-full text-xs font-medium transition shadow-sm ${reaction === "LIKE" ? 'bg-[#5667ff] text-white' : 'bg-background hover:bg-[#ececec] text-slate-700'}`}
        >
          <ThumbsUp size={14} className={reaction === "LIKE" ? "fill-current" : ""} />
          {likesCount > 0 ? likesCount : "Like"}
        </button>

        <button
          onClick={() => handleReact("DISLIKE")}
          className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-full text-xs font-medium transition shadow-sm ${reaction === "DISLIKE" ? 'bg-red-500 text-white' : 'bg-background hover:bg-[#ececec] text-slate-700'}`}
        >
          <ThumbsDown size={14} className={reaction === "DISLIKE" ? "fill-current" : ""} />
          {dislikesCount > 0 && dislikesCount}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex h-9 flex-1 items-center justify-center gap-2 rounded-full bg-background text-slate-700 text-xs font-medium transition hover:bg-[#ececec] shadow-sm"
        >
          <MessageCircle size={14} />
          {post._count?.comments > 0 ? post._count.comments : "Comments"}
        </button>

        <button
          onClick={() => setShowShare(true)}
          className="flex h-9 flex-1 items-center justify-center gap-2 rounded-full bg-background text-slate-700 text-xs font-medium transition hover:bg-[#ececec] shadow-sm"
        >
          <Share2 size={14} /> Share
        </button>

        <button
          onClick={handleSave}
          className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-full text-xs font-medium transition ${isSaved ? 'bg-black text-white' : 'bg-background text-slate-700 hover:bg-[#ececec] shadow-sm'}`}
        >
          <Bookmark size={14} className={isSaved ? "fill-current" : ""} /> {isSaved ? "Saved" : "Save"}
        </button>
      </div>

      {showComments && (
        <div className="mt-3">
          <PostComments postId={post.id} currentUser={currentUser} />
        </div>
      )}

      {/* Modals */}
      {showShare && <ShareModal postId={post.id} onClose={() => setShowShare(false)} />}
      {showReport && <ReportModal postId={post.id} onClose={() => setShowReport(false)} />}
    </div>
  );
}