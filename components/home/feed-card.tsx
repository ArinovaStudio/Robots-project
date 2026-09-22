"use client";

import { useState, useEffect, useRef } from "react";
import { Bookmark, MessageCircle, MoreVertical, Share2, ThumbsUp, Flag, Edit2, Trash2, Send, CalendarDays, MapPin, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import ShareModal from "../modals/share-modal";
import ReportModal from "../modals/report-modal";
import ConfirmModal from "../modals/confirm-modal";
import EditPostModal from "../modals/edit-post-modal";
import PostComments from "./post-comments";
import MediaSlider from "./media-slider";
import Link from "next/link";
import Image from "next/image";

export default function FeedCard({ post, currentUser, onUnsave }: { post: any, currentUser: any, onUnsave?: () => void }) {
  const [isDeleted, setIsDeleted] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);

  const [reaction, setReaction] = useState<"LIKE" | null>(currentPost?.userReaction === "LIKE" ? "LIKE" : null);
  const [likesCount, setLikesCount] = useState(currentPost?.likesCount || 0);
  const [isSaved, setIsSaved] = useState(currentPost?.isSaved || false);
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [latestComment, setLatestComment] = useState<any>(null);

  const isAuthor = currentUser?.id === currentPost?.authorId;
  const authorName = currentPost?.author?.company?.companyName || currentPost?.author?.name || "Independent Professional";
  const authorInitials = authorName.charAt(0).toUpperCase();
  const authorImage = currentPost?.author?.company?.logoUrl || currentPost?.author?.image;

  useEffect(() => {
    // Fetch latest comment for this post
    const fetchLatestComment = async () => {
      try {
        const res = await fetch(`/api/comments?postId=${currentPost.id}&limit=1`);
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          // Assuming the API returns comments sorted by date
          setLatestComment(json.data[json.data.length - 1]);
        }
      } catch (error) {
        // ignore
      }
    };
    if (currentPost._count?.comments > 0) {
      fetchLatestComment();
    }
  }, [currentPost.id, currentPost._count?.comments]);

  const handleReact = async () => {
    const type = "LIKE";
    if (reaction === type) {
      setReaction(null);
      setLikesCount((prev: any) => prev - 1);
    } else {
      setReaction(type);
      setLikesCount((prev: any) => prev + 1);
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
              {authorImage ? (
                <img 
                  src={authorImage} 
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

        {/* Event Card */}
        {currentPost.event && (
          <div className="mt-4 rounded-xl border border-orange-200 overflow-hidden bg-white shadow-sm hover:shadow-md transition">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 flex items-center justify-between">
              <div>
                <span className="inline-block px-2 py-1 bg-white/20 text-white text-xs font-semibold rounded-full mb-2 backdrop-blur-sm">
                  Upcoming Event
                </span>
                <h3 className="text-lg font-bold text-white line-clamp-2">{currentPost.event.title}</h3>
              </div>
              <div className="flex flex-col items-center justify-center bg-white rounded-lg p-2 min-w-16 shadow-inner shrink-0 ml-4">
                <span className="text-xs font-bold text-orange-600 uppercase">
                  {new Date(currentPost.event.date).toLocaleString('default', { month: 'short' })}
                </span>
                <span className="text-xl font-black text-gray-900 leading-none">
                  {new Date(currentPost.event.date).getDate()}
                </span>
              </div>
            </div>
            
            <div className="p-4 bg-orange-50/50">
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2 text-gray-700">
                  <CalendarDays className="w-4 h-4 mt-0.5 shrink-0 text-orange-500" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      {new Date(currentPost.event.date).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-gray-500">
                      {new Date(currentPost.event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                
                {currentPost.event.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <MapPin className="w-4 h-4 shrink-0 text-orange-500" />
                    <span className="truncate">{currentPost.event.location}</span>
                  </div>
                )}
                
                {currentPost.event.link && (
                  <div className="mt-3 pt-3 border-t border-orange-100 flex justify-end">
                    <a 
                      href={currentPost.event.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 text-sm font-semibold rounded-full transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Event Link
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
        
      {currentPost.media && currentPost.media.length > 0 && (
        <div className="px-4 pb-1">
          <MediaSlider
            key={currentPost.media.map((m: any) => m.id).join('-')}
            media={currentPost.media}
          />
        </div>
      )}



      {/* Social Counts */}
      {(likesCount > 0 || currentPost._count?.comments > 0) && (
        <div className="px-4 py-2 border-t border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            {likesCount > 0 && <span className="flex items-center gap-1"><ThumbsUp size={12} className="text-blue-500 fill-blue-500" /> {likesCount}</span>}
          </div>
          <div>
            {currentPost._count?.comments > 0 && <span className="cursor-pointer hover:underline" onClick={() => setShowComments(true)}>{currentPost._count.comments} comments</span>}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-2 py-1 flex items-center justify-between">
        <button onClick={handleReact} className={`flex flex-1 items-center justify-center gap-2 px-2 py-3 rounded-md text-sm font-medium transition-colors ${reaction === "LIKE" ? 'text-blue-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
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

      {/* Latest Comment Showcase */}
      {!showComments && latestComment && (
        <LatestCommentPreview
          comment={latestComment}
          currentUser={currentUser}
          onExpandComments={() => setShowComments(true)}
        />
      )}

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

/* ──────────────── Latest Comment Preview with Dots Menu ──────────────── */
function LatestCommentPreview({ comment, currentUser, onExpandComments }: { comment: any; currentUser: any; onExpandComments: () => void }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [displayContent, setDisplayContent] = useState(comment.content);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = currentUser?.id === comment.authorId;
  const authorName = comment.author?.company?.companyName || comment.author?.name || "User";
  const avatarSrc = comment.author?.company?.logoUrl || comment.author?.image;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = async () => {
    if (!confirm("Delete this comment?")) return;
    const res = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
    if (res.ok) setIsDeleted(true);
    setShowMenu(false);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || editContent === displayContent) return setIsEditing(false);
    setIsSaving(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        setDisplayContent(editContent);
        setIsEditing(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isDeleted) return null;

  return (
    <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-100 text-sm">
      <div className="flex items-start gap-2">
        {/* Avatar */}
        {avatarSrc ? (
          <img src={avatarSrc} className="w-7 h-7 rounded-full object-cover shrink-0 border border-gray-100" alt={authorName} />
        ) : (
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">
            {authorName.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Bubble */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                rows={2}
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-full transition">Cancel</button>
                <button onClick={handleSaveEdit} disabled={isSaving} className="px-3 py-1 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-full transition disabled:opacity-50">
                  {isSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 rounded-xl px-3 py-2 relative group">
              <span className="font-semibold text-gray-900 text-xs">{authorName} </span>
              <span className="text-gray-700 text-xs line-clamp-2">{displayContent}</span>
            </div>
          )}

          <button onClick={onExpandComments} className="mt-1 text-[11px] font-semibold text-blue-600 hover:underline pl-1">
            View all comments
          </button>
        </div>

        {/* Three-dot menu — only for comment owner */}
        {isOwner && !isEditing && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition opacity-0 group-hover:opacity-100"
              style={{ opacity: showMenu ? 1 : undefined }}
            >
              <MoreVertical size={14} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-6 w-32 bg-white border border-gray-200 shadow-lg rounded-xl z-20 overflow-hidden py-1">
                <button
                  onClick={() => { setIsEditing(true); setShowMenu(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition"
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}