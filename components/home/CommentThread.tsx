import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, Loader2, MoreVertical, Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react";

export function CommentThread({ comment, postId, currentUser, onDelete }: { comment: any, postId: string, currentUser: any, onDelete: (id: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const [reaction, setReaction] = useState<"LIKE" | "DISLIKE" | null>(comment.userReaction || null);
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0);
  const [dislikesCount, setDislikesCount] = useState(comment.dislikesCount || 0);
  
  const [showMenu, setShowMenu] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [timeDisplay, setTimeDisplay] = useState("");

  const authorName = comment.author?.company?.companyName || comment.author?.name || "User";
  const isOwner = currentUser?.id === comment.authorId;

  const handleReact = async (type: "LIKE" | "DISLIKE") => {
    if (!currentUser) return alert("Please log in to react to comments.");

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
      await fetch(`/api/comments/${comment.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
    } catch {}
  };

  const handleDelete = async () => {
    if (!currentUser) return alert("Please log in to delete to comments.");
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
      if (res.ok) onDelete(comment.id);
    } catch {
      alert("Failed to delete comment");
    }
  };

  const handleEdit = async () => {
    if (!currentUser) return alert("Please log in to edit to comments.");
    if (!editContent.trim() || editContent === comment.content) return setIsEditing(false);
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent })
      });
      if (res.ok) {
        comment.content = editContent; 
        setIsEditing(false);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchNestedReplies = async () => {
    setLoadingReplies(true);
    try {
      const res = await fetch(`/api/comments?postId=${postId}&parentId=${comment.id}&limit=50`);
      const json = await res.json();
      if (json.success) setReplies(json.data);
    } finally {
      setLoadingReplies(false);
    }
  };

  const toggleReplies = () => {
    if (!showReplies && replies.length === 0) fetchNestedReplies();
    setShowReplies(!showReplies);
  };

  const handlePostReply = async () => {
    if (!currentUser) return alert("Please log in to reply.");
    if (!replyContent.trim()) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content: replyContent, parentId: comment.id })
      });
      if (res.ok) {
        setReplyContent("");
        setIsReplying(false);
        fetchNestedReplies(); 
        setShowReplies(true);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const diffMs = Date.now() - new Date(comment.createdAt).getTime();
      const diffSecs = Math.floor(diffMs / 1000);

      if (diffSecs < 60) {
        setTimeDisplay(diffSecs <= 0 ? "Just now" : `${diffSecs}s ago`);
        return;
      }

      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) {
        setTimeDisplay(`${diffMins}m ago`);
        return;
      }

      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24) {
        setTimeDisplay(`${diffHrs}h ago`);
        return;
      }

      setTimeDisplay(new Date(comment.createdAt).toLocaleDateString());
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); 
    
    return () => clearInterval(interval);
  }, [comment.createdAt]);

  return (
    <div className="flex gap-3 text-sm">
      {/* Avatar */}
      {comment.author?.company?.logoUrl ? (
        <img 
          src={comment.author.company.logoUrl} 
          alt={authorName} 
          className="h-8 w-8 shrink-0 rounded-full object-cover border border-slate-100" 
        />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-500">
          {authorName.charAt(0)}
        </div>
      )}
      
      <div className="flex-1">
        {/* Author & Time */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-slate-900">{authorName}</span>
          <span className="text-[11px] text-slate-400">{timeDisplay}</span>
          
          {/* Options Menu (Edit/Delete) */}
          {isOwner && (
            <div className="relative ml-auto">
              <button onClick={() => setShowMenu(!showMenu)} className="text-slate-400 hover:text-slate-600 p-1">
                <MoreVertical size={14} />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-6 w-32 bg-white border border-slate-200 shadow-lg rounded-xl z-10 overflow-hidden">
                  <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                    <Edit2 size={12} /> Edit
                  </button>
                  <button onClick={() => { handleDelete(); setShowMenu(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-slate-50">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content or Edit Field */}
        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#5667ff] min-h-[60px]"
            />
            <div className="flex gap-2 mt-2 justify-end">
              <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-full">Cancel</button>
              <button onClick={handleEdit} disabled={isUpdating} className="px-3 py-1.5 text-xs font-medium bg-[#5667ff] text-white hover:bg-[#4555e5] rounded-full">
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
        )}
        
        {/* Action Bar (Like, Dislike, Reply) */}
        {!isEditing && (
          <div className="flex items-center gap-4 mt-2 text-xs font-medium text-slate-500">
            {/* FIX 3: Display likes count accurately */}
            <button onClick={() => handleReact("LIKE")} className={`flex items-center gap-1.5 transition hover:text-[#5667ff] ${reaction === "LIKE" ? "text-[#5667ff]" : ""}`}>
              <ThumbsUp size={14} className={reaction === "LIKE" ? "fill-current" : ""} /> 
              {likesCount > 0 && likesCount}
            </button>
            {/* FIX 4: Display dislikes count accurately */}
            <button onClick={() => handleReact("DISLIKE")} className={`flex items-center gap-1.5 transition hover:text-red-500 ${reaction === "DISLIKE" ? "text-red-500" : ""}`}>
              <ThumbsDown size={14} className={reaction === "DISLIKE" ? "fill-current" : ""} />
              {dislikesCount > 0 && dislikesCount}
            </button>

            <button onClick={() => setIsReplying(!isReplying)} className="hover:text-slate-800 transition">
              Reply
            </button>
          </div>
        )}

        {/* Inline Reply Input */}
        {isReplying && (
          <div className="flex gap-2 mt-3 animate-in fade-in slide-in-from-top-2">
            {currentUser?.image || currentUser?.company?.logoUrl ? (
              <img 
                src={currentUser.image || currentUser.company.logoUrl} 
                alt={currentUser?.name || "User"} 
                className="h-9 w-9 shrink-0 rounded-full object-cover border border-slate-100" 
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF] text-sm font-bold text-[#5667ff]">
                {currentUser?.name?.charAt(0) || "U"}
              </div>
            )}
            <div className="flex-1">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#5667ff]"
                rows={2}
              />
              <div className="flex justify-end gap-2 mt-1">
                <button onClick={() => setIsReplying(false)} className="px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-full">Cancel</button>
                <button onClick={handlePostReply} disabled={isUpdating || !replyContent.trim()} className="px-3 py-1 text-xs font-medium bg-[#5667ff] text-white hover:bg-[#4555e5] rounded-full">
                  Reply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Nested Replies Toggle */}
        {comment._count?.replies > 0 && (
          <div className="mt-2">
            <button 
              onClick={toggleReplies} 
              className="flex items-center gap-1.5 text-xs font-bold text-[#5667ff] hover:bg-[#EEF0FF] px-2 py-1 rounded-full transition"
            >
              {showReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showReplies ? "Hide replies" : `${comment._count.replies} ${comment._count.replies === 1 ? 'reply' : 'replies'}`}
            </button>
          </div>
        )}

        {/* Render Nested Replies */}
        {showReplies && (
          <div className="mt-4 pl-4 border-l-2 border-slate-100 space-y-4">
            {loadingReplies ? (
              <Loader2 className="animate-spin text-slate-300 h-5 w-5 ml-2" />
            ) : (
              replies.map(reply => (
                <CommentThread 
                  key={reply.id} 
                  comment={reply} 
                  postId={postId} 
                  currentUser={currentUser} 
                  onDelete={(id) => setReplies(prev => prev.filter(r => r.id !== id))}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}