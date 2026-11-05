"use client";

import { useState, useEffect, useRef } from "react";
import { Bookmark, Repeat2, Check, Link2, UserMinus, EyeOff, MessageCircle, MoreVertical, Share2, Flag, Edit2, Trash2, Send, CalendarDays, MapPin, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import ShareModal from "../modals/share-modal";
import ReportModal from "../modals/report-modal";
import ConfirmModal from "../modals/confirm-modal";
import RepostModal from "../modals/repost-modal";
import EmbeddedPost, { EventCard } from "./embedded-post";
import EditPostModal from "../modals/edit-post-modal";
import PostComments from "./post-comments";
import MediaSlider from "./media-slider";
import Link from "next/link";
import Image from "next/image";
import VerificationBadge from "@/components/ui/VerificationBadge";
import ReadMoreText from "@/components/ui/read-more-text";
import ReactionButton from "./reaction-button";
import ReactionSummary from "./reaction-summary";
import ReactionsModal from "../modals/reactions-modal";
import { isPostReactionType, type PostReactionType, type ReactionCounts } from "@/lib/reactions";

export default function FeedCard({ post, currentUser, onUnsave }: { post: any, currentUser: any, onUnsave?: () => void }) {
  const [isDeleted, setIsDeleted] = useState(false);
  const [currentPost, setCurrentPost] = useState(post);

  const [reaction, setReaction] = useState<PostReactionType | null>(isPostReactionType(currentPost?.userReaction) ? currentPost.userReaction : null);
  const [reactionCounts, setReactionCounts] = useState<ReactionCounts>(currentPost?.reactionCounts || {});
  const [likesCount, setLikesCount] = useState<number>(currentPost?.likesCount || 0);
  const [showReactions, setShowReactions] = useState(false);
  const [isSaved, setIsSaved] = useState(currentPost?.isSaved || false);
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showComments, setShowComments] = useState(false);
  
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRepost, setShowRepost] = useState(false);
  const [hasReposted, setHasReposted] = useState<boolean>(currentPost?.hasReposted || false);
  const [showUndoRepost, setShowUndoRepost] = useState(false);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState<boolean>(currentPost?.isFollowingAuthor || false);
  const [isHidden, setIsHidden] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);

  const [latestComment, setLatestComment] = useState<any>(null);

  const isAuthor = currentUser?.id === currentPost?.authorId;
  const authorName = currentPost?.author?.company?.companyName || currentPost?.author?.name || "Independent Professional";
  const authorInitials = authorName.charAt(0).toUpperCase();
  const authorImage = currentPost?.author?.company?.logoUrl || currentPost?.author?.image;

  const isRepost = !!currentPost?.repostOfId;
  const repostTarget = isRepost ? currentPost?.repostOf : currentPost;
  const targetIsOwn = repostTarget?.authorId === currentUser?.id;
  const targetConnectionsOnly = !isRepost && currentPost?.visibility === "CONNECTIONS";
  const repostDisabled = !repostTarget || targetIsOwn || (targetConnectionsOnly && !hasReposted);
  const repostTitle = !repostTarget
    ? "Original post is unavailable"
    : targetIsOwn
    ? "You can't repost your own post"
    : targetConnectionsOnly
    ? "Connections-only posts can't be reposted"
    : "Repost";
  const canComment = currentPost?.canComment !== false;

  useEffect(() => {
    const fetchLatestComment = async () => {
      try {
        const res = await fetch(`/api/comments?postId=${currentPost.id}&limit=1`);
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setLatestComment(json.data[json.data.length - 1]);
        }
      } catch (error) {
      }
    };
    if (currentPost._count?.comments > 0) {
      fetchLatestComment();
    }
  }, [currentPost.id, currentPost._count?.comments]);

  // Optimistically moves the viewer's reaction from `from` to `to` (either can be null).
  const applyReaction = (from: PostReactionType | null, to: PostReactionType | null) => {
    setReaction(to);
    setReactionCounts((prev) => {
      const next = { ...prev };
      if (from) next[from] = Math.max(0, (next[from] ?? 0) - 1);
      if (to) next[to] = (next[to] ?? 0) + 1;
      return next;
    });
    setLikesCount((prev) => Math.max(0, prev + (to ? 1 : 0) - (from ? 1 : 0)));
  };

  const sendReaction = async (type: PostReactionType | null, previous: PostReactionType | null) => {
    try {
      const res = await fetch(`/api/posts/${currentPost.id}/react`, {
        method: type ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: type ? JSON.stringify({ type }) : undefined,
      });
      if (!res.ok) throw new Error();
    } catch {
      applyReaction(type, previous); // roll back
      toast.error("Couldn't update your reaction. Please try again.");
    }
  };

  const handleSelectReaction = (type: PostReactionType) => {
    const previous = reaction;
    if (previous === type) return;
    applyReaction(previous, type);
    sendReaction(type, previous);
  };

  const handleRemoveReaction = () => {
    const previous = reaction;
    if (!previous) return;
    applyReaction(previous, null);
    sendReaction(null, previous);
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

  const handleUndoRepost = async () => {
    setIsUndoing(true);
    try {
      const res = await fetch(`/api/posts/${repostTarget.id}/repost`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setHasReposted(false);
        toast.success("Repost removed");
      } else {
        toast.error(data.message || "Failed to undo repost");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsUndoing(false);
      setShowUndoRepost(false);
    }
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/post/${currentPost.id}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  const handleUnfollow = async () => {
    try {
      const res = await fetch("/api/network/follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: currentPost.authorId }),
      });
      const data = await res.json();
      if (data.success) {
        setIsFollowingAuthor(false);
        toast.success(`Unfollowed ${authorName}`);
      } else {
        toast.error(data.message || "Failed to unfollow");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleNotInterested = async () => {
    setIsHidden(true);
    try {
      const res = await fetch(`/api/posts/${currentPost.id}/not-interested`, { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        setIsHidden(false);
        toast.error(data.message || "Something went wrong");
      }
    } catch {
      setIsHidden(false);
      toast.error("An error occurred");
    }
  };

  const handleUndoNotInterested = async () => {
    setIsHidden(false);
    try {
      await fetch(`/api/posts/${currentPost.id}/not-interested`, { method: "DELETE" });
    } catch {}
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

  if (isHidden) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg mb-4 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <EyeOff size={16} className="text-gray-400 shrink-0" />
          <span>Post hidden. We'll show you fewer posts like this.</span>
        </div>
        <button onClick={handleUndoNotInterested} className="text-sm font-semibold text-blue-600 hover:underline shrink-0">
          Undo
        </button>
      </div>
    );
  } 

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-4 flex flex-col">
      {isRepost && (
        <div className="px-4 pt-3 flex items-center gap-1.5 text-xs text-gray-500">
          <Repeat2 size={14} />
          <span><span className="font-semibold text-gray-700">{authorName}</span> reposted this</span>
        </div>
      )}
      <div className="p-4 relative">
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
                <h3 className="text-sm font-bold text-gray-900 hover:text-blue-600 hover:underline flex items-center gap-1.5">
                  <span>{authorName}</span>
                  <VerificationBadge status={currentPost.author?.verificationStatus} size="xs" />
                </h3>
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
          <div className="relative">
            <button onClick={() => setShowDropdown(!showDropdown)} className="text-gray-500 hover:bg-gray-100 p-1.5 rounded-full transition">
              <MoreVertical size={18} />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 top-8 w-56 bg-white border border-gray-200 shadow-md rounded-md z-20 overflow-hidden py-1">
                <button onClick={() => { handleSave(); setShowDropdown(false); }} className={`flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 ${isSaved ? "text-blue-600" : "text-gray-700"}`}>
                  <Bookmark size={14} className={isSaved ? "fill-current" : ""} /> {isSaved ? "Unsave" : "Save"}
                </button>
                <button onClick={() => { handleCopyLink(); setShowDropdown(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Link2 size={14} /> Copy link to post
                </button>
                {!isAuthor && isFollowingAuthor && (
                  <button onClick={() => { handleUnfollow(); setShowDropdown(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <UserMinus size={14} /> <span className="truncate">Unfollow {authorName}</span>
                  </button>
                )}
                {!isAuthor && (
                  <button onClick={() => { handleNotInterested(); setShowDropdown(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <EyeOff size={14} /> Not interested
                  </button>
                )}
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
        {currentPost.content && (
          <div className="mt-3 text-sm leading-relaxed text-[#172033]">
            <ReadMoreText
              text={currentPost.content}
              charLimit={260}
              title={`Post by ${authorName}`}
              className="text-sm leading-relaxed text-[#172033] whitespace-pre-wrap"
            />
          </div>
        )}
        {isRepost && (
          <div className="mt-3">
            <EmbeddedPost post={currentPost.repostOf} />
          </div>
        )}
        {currentPost.event && <EventCard event={currentPost.event} />}
      </div>
        
      {currentPost.media && currentPost.media.length > 0 && (
        <div className="px-4 pb-1">
          <MediaSlider
            key={currentPost.media.map((m: any) => m.id).join('-')}
            media={currentPost.media}
          />
        </div>
      )}
      {(likesCount > 0 || currentPost._count?.comments > 0) && (
        <div className="px-4 py-2 border-t border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <ReactionSummary counts={reactionCounts} total={likesCount} userReaction={reaction} onOpen={() => setShowReactions(true)} />
          </div>
          <div>
            {currentPost._count?.comments > 0 && <span className="cursor-pointer hover:underline" onClick={() => setShowComments(true)}>{currentPost._count.comments} comments</span>}
          </div>
        </div>
      )}

      <div className="px-2 py-1 flex items-center justify-between">
        <ReactionButton value={reaction} onSelect={handleSelectReaction} onRemove={handleRemoveReaction} />
        <button onClick={() => setShowComments(!showComments)} className="flex flex-1 items-center justify-center gap-2 px-2 py-3 rounded-md text-gray-500 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900">
          <MessageCircle size={18} /> Comment
        </button>
        <button
          onClick={() => (hasReposted ? setShowUndoRepost(true) : setShowRepost(true))}
          disabled={repostDisabled}
          title={hasReposted ? "You reposted this" : repostTitle}
          className={`flex flex-1 items-center justify-center gap-2 px-2 py-3 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent ${hasReposted ? "text-green-600 hover:bg-green-50" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}`}
        >
          {hasReposted ? <Check size={18} /> : <Repeat2 size={18} />} {hasReposted ? "Reposted" : "Repost"}
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
          <PostComments postId={currentPost.id} currentUser={currentUser} canComment={canComment} />
        </div>
      )}

      {/* Modals */}
      {showShare && <ShareModal postId={currentPost.id} onClose={() => setShowShare(false)} />}
      {showReactions && (
        <ReactionsModal
          postId={currentPost.id}
          initialCounts={reactionCounts}
          initialTotal={likesCount}
          onClose={() => setShowReactions(false)}
        />
      )}
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

      {/* Repost Modal */}
      {showRepost && repostTarget && (
        <RepostModal
          post={repostTarget}
          currentUser={currentUser}
          onClose={() => setShowRepost(false)}
          onSuccess={() => setHasReposted(true)}
        />
      )}

      {/* Undo Repost Modal */}
      <ConfirmModal
        isOpen={showUndoRepost}
        title="Undo repost?"
        message="This will remove your repost from your profile and your followers' feeds."
        confirmText="Undo repost"
        cancelText="Cancel"
        variant="danger"
        isLoading={isUndoing}
        onConfirm={handleUndoRepost}
        onCancel={() => setShowUndoRepost(false)}
      />

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
      <div className="flex items-start gap-2 group">
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
            <div className="bg-gray-100 rounded-xl px-3 py-2">
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
              className={`p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition ${
                showMenu ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
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