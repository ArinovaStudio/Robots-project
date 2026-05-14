"use client";

import { useState } from "react";
import { Bookmark, MessageCircle, MoreVertical, Share2, ThumbsUp, ThumbsDown, Flag, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ShareModal from "../modals/share-modal";
import ReportModal from "../modals/report-modal";
import ConfirmModal from "../modals/confirm-modal";
import EditPostModal from "../modals/edit-post-modal";
import PostComments from "./post-comments";
import MediaSlider from "./media-slider";

export default function FeedCard({ post, currentUser }: { post: any, currentUser: any }) {
  const [isDeleted, setIsDeleted] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);

  const [reaction, setReaction] = useState<"LIKE" | "DISLIKE" | null>(currentPost?.userReaction || null);
  const [likesCount, setLikesCount] = useState(currentPost?.likesCount || 0);
  const [dislikesCount, setDislikesCount] = useState(currentPost?.dislikesCount || 0);
  const [isSaved, setIsSaved] = useState(currentPost?.isSaved || false);
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = currentUser?.id === currentPost?.authorId;
  const authorName = currentPost?.author?.company?.companyName || currentPost?.author?.name || "Independent Professional";
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
      await fetch(`/api/posts/${currentPost.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
    } catch {}
  };

  const handleSave = async () => {
    setIsSaved(!isSaved);
    try {
      await fetch(`/api/posts/${currentPost.id}/save`, { method: "POST" });
    } catch {
      setIsSaved(isSaved);
    }
  };

  const handleDeletePost = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${currentPost.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Post deleted");
        setIsDeleted(true); 
      } else {
        toast.error(data.message || "Failed to delete post");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isDeleted || !currentPost) return null; 

  return (
    <div className="flex flex-col">
      <div className="bg-background p-4 rounded-2xl relative shadow-sm border border-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {currentPost.author?.company?.logoUrl ? (
              <img src={currentPost.author.company.logoUrl} className="h-10 w-10 rounded-full object-cover" alt="Logo" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF0FF] text-base font-bold text-[#5667ff]">
                {authorInitials}
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold">{authorName}</h3>
              <p className="text-xs text-slate-400">
                {new Date(currentPost.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* 3-Dots Menu */}
          <div className="relative">
            <button onClick={() => setShowDropdown(!showDropdown)} className="text-slate-500 hover:bg-slate-50 p-1.5 rounded-full transition">
              <MoreVertical size={18} />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 top-8 w-36 bg-white border border-slate-200 shadow-md rounded-xl z-20 overflow-hidden py-1">
                {isAuthor ? (
                  <>
                    <button onClick={() => { setShowEdit(true); setShowDropdown(false); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50">
                      <Edit2 size={14} /> Edit Post
                    </button>
                    <button onClick={() => { setShowDeleteConfirm(true); setShowDropdown(false); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 border-t border-slate-50">
                      <Trash2 size={14} /> Delete
                    </button>
                  </>
                ) : (
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
          {currentPost.content}
        </div>
        
        {currentPost.media && currentPost.media.length > 0 && (
          <MediaSlider 
            key={currentPost.media.map((m: any) => m.id).join('-')} 
            media={currentPost.media} 
          />
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <button onClick={() => handleReact("LIKE")} className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-full text-xs font-medium transition shadow-sm ${reaction === "LIKE" ? 'bg-[#5667ff] text-white' : 'bg-background hover:bg-[#ececec] text-slate-700'}`}>
          <ThumbsUp size={14} className={reaction === "LIKE" ? "fill-current" : ""} /> {likesCount > 0 ? likesCount : "Like"}
        </button>
        <button onClick={() => handleReact("DISLIKE")} className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-full text-xs font-medium transition shadow-sm ${reaction === "DISLIKE" ? 'bg-red-500 text-white' : 'bg-background hover:bg-[#ececec] text-slate-700'}`}>
          <ThumbsDown size={14} className={reaction === "DISLIKE" ? "fill-current" : ""} /> {dislikesCount > 0 && dislikesCount}
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex h-9 flex-1 items-center justify-center gap-2 rounded-full bg-background text-slate-700 text-xs font-medium transition hover:bg-[#ececec] shadow-sm">
          <MessageCircle size={14} /> {currentPost._count?.comments > 0 ? currentPost._count.comments : "Comments"}
        </button>
        <button onClick={() => setShowShare(true)} className="flex h-9 flex-1 items-center justify-center gap-2 rounded-full bg-background text-slate-700 text-xs font-medium transition hover:bg-[#ececec] shadow-sm">
          <Share2 size={14} /> Share
        </button>
        <button onClick={handleSave} className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-full text-xs font-medium transition ${isSaved ? 'bg-black text-white' : 'bg-background text-slate-700 hover:bg-[#ececec] shadow-sm'}`}>
          <Bookmark size={14} className={isSaved ? "fill-current" : ""} /> {isSaved ? "Saved" : "Save"}
        </button>
      </div>

      {showComments && (
        <div className="mt-3">
          <PostComments postId={currentPost.id} currentUser={currentUser} />
        </div>
      )}

      {/* Modals */}
      {showShare && <ShareModal postId={currentPost.id} onClose={() => setShowShare(false)} />}
      {showReport && <ReportModal postId={currentPost.id} onClose={() => setShowReport(false)} />}
      
      {/* Edit Post Modal */}
      {showEdit && (
        <EditPostModal 
          post={currentPost} 
          onClose={() => setShowEdit(false)} 
          onSuccess={(newContent: string, newMergedMedia: any[]) => {
            setCurrentPost({ 
               ...currentPost, 
               content: newContent, 
               media: newMergedMedia 
            });
            setShowEdit(false);
          }} 
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Post?"
        message="Are you sure you want to permanently delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeletePost}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}