"use client";

import { useState, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { CommentThread } from "./CommentThread";

const INITIAL_COUNT = 3; // comments shown when the section is first opened
const LOAD_MORE_COUNT = 10; // comments added on every "Show more comments" click

export default function PostComments({ postId, currentUser, canComment = true, onHide }: { postId: string, currentUser: any, canComment?: boolean, onHide?: () => void }) {
  const [comments, setComments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [posting, setPosting] = useState(false);

  const remaining = Math.max(0, total - comments.length);
  const hasMore = remaining > 0;

  // Fetch `limit` comments starting after `offset` already-loaded comments.
  const fetchComments = async (offset: number, limit: number, append = false) => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}&offset=${offset}&limit=${limit}`);
      const json = await res.json();
      if (json.success) {
        if (append) {
          // de-dupe in case a new comment shifted the server-side offset
          setComments(prev => {
            const seen = new Set(prev.map(c => c.id));
            return [...prev, ...json.data.filter((c: any) => !seen.has(c.id))];
          });
        } else {
          setComments(json.data);
        }
        setTotal(json.pagination.total);
      }
    } catch (error) {
      console.error("Failed to load comments", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setComments([]);
    fetchComments(0, INITIAL_COUNT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleShowMore = () => {
    if (loadingMore) return;
    setLoadingMore(true);
    fetchComments(comments.length, LOAD_MORE_COUNT, true);
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setPosting(true);

    try {
      const res = await fetch(`/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content: newComment })
      });
      const json = await res.json();

      if (json.success) {
        setNewComment("");
        // show the new comment at the top without collapsing what's already loaded
        if (json.data) {
          setComments(prev => [json.data, ...prev]);
          setTotal(prev => prev + 1);
        } else {
          fetchComments(0, Math.max(comments.length + 1, INITIAL_COUNT));
        }
      } else {
        alert(json.message);
      }
    } finally {
      setPosting(false);
    }
  };

  const removeCommentFromState = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
    setTotal(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="bg-white border-t border-slate-100 p-4 rounded-b-2xl">
      {/* Top Input Section */}
      {!canComment && (
        <div className="mb-6 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-500">
          Only the author's connections can comment on this post.
        </div>
      )}
      {canComment && <div className={`flex gap-3 ${loading || comments.length > 0 ? "mb-6" : ""}`}>
        {currentUser?.image || currentUser?.company?.logoUrl ? (
          <img 
            src={currentUser?.company?.logoUrl || currentUser?.image} 
            alt={currentUser?.company?.companyName || currentUser?.name || "User"} 
            className="h-9 w-9 shrink-0 rounded-full object-cover border border-slate-100" 
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
            {(currentUser?.company?.companyName || currentUser?.name || "U").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a public comment..."
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-32 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white min-h-[50px]"
          />
          <button
            onClick={handlePostComment}
            disabled={posting || !newComment.trim()}
            className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Comment
          </button>
        </div>
      </div>}

      {/* Scrollable Comments Area (hidden entirely when there are no comments) */}
      {(loading || comments.length > 0) && <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar space-y-5">
        {loading ? (
          <div className="py-4 flex justify-center"><Loader2 className="animate-spin text-slate-300 h-6 w-6" /></div>
        ) : (
          comments.map((comment) => (
            <CommentThread 
              key={comment.id} 
              comment={comment} 
              postId={postId} 
              currentUser={currentUser} 
              onDelete={removeCommentFromState}
            />
          ))
        )}

        {/* Show more button – stays pinned at the bottom of the list */}
        {hasMore && !loading && (
          <div className="sticky bottom-0 bg-white pt-1">
            <button
              onClick={handleShowMore}
              disabled={loadingMore}
              className="flex w-full items-center justify-center gap-2 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition disabled:opacity-60"
            >
              {loadingMore && <Loader2 size={14} className="animate-spin" />}
              Show more comments ({remaining} remaining)
            </button>
          </div>
        )}
      </div>}

      {/* Hide comments – collapses the section again */}
      {onHide && (
        <button
          onClick={onHide}
          className="mt-3 w-full py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition"
        >
          Hide comments
        </button>
      )}
    </div>
  );
}