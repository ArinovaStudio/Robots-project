"use client";

import { useState } from "react";
import { Bookmark, MessageCircle, MoreVertical, Share2, ThumbsUp, ThumbsDown, Flag, Edit2, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import ShareModal from "../modals/share-modal";
import ReportModal from "../modals/report-modal";
import ConfirmModal from "../modals/confirm-modal";
import EditPostModal from "../modals/edit-post-modal";
import PostComments from "./post-comments";
import MediaSlider from "./media-slider";
import Link from "next/link";

export default function FeedCard({ post, currentUser, onUnsave }: { post: any, currentUser: any, onUnsave?: () => void }) {
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
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);
    
    if (!newSavedState && onUnsave) {
      onUnsave();
    }

    try {
      await fetch(`/api/posts/${currentPost.id}/save`, { method: "POST" });
    } catch {
      setIsSaved(!newSavedState);
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
    <div className="bg-white border border-gray-200 rounded-lg mb-4 flex flex-col">
      <div className="p-4 relative">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${currentPost.author?.id}`} className="shrink-0 block">
              {currentPost.author?.company?.logoUrl ? (
                <img 
                  src={currentPost.author.company.logoUrl} 
                  className="h-12 w-12 rounded-full object-cover border border-gray-100 hover:opacity-80 transition" 
                  alt="Logo" 
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600 hover:opacity-80 transition">
                  {authorInitials}
                </div>
              )}
            </Link>
            <div>
              <Link href={`/profile/${currentPost.author?.id}`}>
                <h3 className="text-sm font-bold text-gray-900 hover:text-blue-600 hover:underline">{authorName}</h3>
              </Link>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xs text-gray-500">
                  {new Date(currentPost.isEdited ? currentPost.updatedAt : currentPost.createdAt).toLocaleDateString()}
                </p>
                {currentPost.isEdited && (
                  <span className="text-[10px] text-gray-400">• Edited</span>
                )}
              </div>
            </div>
          </div>

          {/* 3-Dots Menu */}
          <div className="relative">
            <button onClick={() => setShowDropdown(!showDropdown)} className="text-gray-500 hover:bg-gray-100 p-1.5 rounded-full transition">
              <MoreVertical size={18} />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 top-8 w-36 bg-white border border-gray-200 shadow-md rounded-md z-20 overflow-hidden py-1">
                {isAuthor ? (
                  <>
                    <button onClick={() => { setShowEdit(true); setShowDropdown(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <Edit2 size={14} /> Edit Post
                    </button>
                    <button onClick={() => { setShowDeleteConfirm(true); setShowDropdown(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <Trash2 size={14} /> Delete
                    </button>
                  </>
                ) : (
                  <button onClick={() => { setShowReport(true); setShowDropdown(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                    <Flag size={14} /> Report
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mt-3 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
          {currentPost.content}
        </div>
      </div>
        
      {currentPost.media && currentPost.media.length > 0 && (
        <div className="bg-gray-50 border-y border-gray-100">
          <MediaSlider 
            key={currentPost.media.map((m: any) => m.id).join('-')} 
            media={currentPost.media} 
          />
        </div>
      )}

      {/* Social Counts */}
      {(likesCount > 0 || dislikesCount > 0 || currentPost._count?.comments > 0) && (
        <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            {likesCount > 0 && <span className="flex items-center gap-1"><ThumbsUp size={12} className="text-blue-500 fill-blue-500" /> {likesCount}</span>}
            {dislikesCount > 0 && <span className="flex items-center gap-1 ml-2"><ThumbsDown size={12} className="text-red-500 fill-red-500" /> {dislikesCount}</span>}
          </div>
          <div>
            {currentPost._count?.comments > 0 && <span>{currentPost._count.comments} comments</span>}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-2 py-1 flex items-center justify-between">
        <button onClick={() => handleReact("LIKE")} className={`flex flex-1 items-center justify-center gap-2 px-2 py-3 rounded-md text-sm font-medium transition-colors ${reaction === "LIKE" ? 'text-blue-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
          <ThumbsUp size={18} className={reaction === "LIKE" ? "fill-current" : ""} /> Like
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex flex-1 items-center justify-center gap-2 px-2 py-3 rounded-md text-gray-500 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900">
          <MessageCircle size={18} /> Comment
        </button>
        <button onClick={handleSave} className={`flex flex-1 items-center justify-center gap-2 px-2 py-3 rounded-md text-sm font-medium transition-colors ${isSaved ? 'text-blue-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
          <Bookmark size={18} className={isSaved ? "fill-current" : ""} /> Save
        </button>
        <button onClick={() => setShowShare(true)} className="flex flex-1 items-center justify-center gap-2 px-2 py-3 rounded-md text-gray-500 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900">
          <Send size={18} /> Send
        </button>
      </div>

      {showComments && (
        <div className="bg-gray-50 border-t border-gray-100 rounded-b-lg">
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
               media: newMergedMedia,
               isEdited: true,
               updatedAt: new Date().toISOString()
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