"use client";

import { useState, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { CommentThread } from "./CommentThread";

export default function PostComments({ postId, currentUser }: { postId: string, currentUser: any }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchComments = async (pageNum: number, append = false) => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}&page=${pageNum}&limit=10`);
      const json = await res.json();
      if (json.success) {
        const sortedData = json.data.sort((a: any, b: any) => b._count.reactions - a._count.reactions);
        
        if (append) {
          setComments(prev => [...prev, ...sortedData]);
        } else {
          setComments(sortedData);
        }
        setHasMore(pageNum < json.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to load comments", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(1);
  }, [postId]);

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
        fetchComments(1); 
      } else {
        alert(json.message);
      }
    } finally {
      setPosting(false);
    }
  };

  const removeCommentFromState = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  return (
    <div className="bg-white border-t border-slate-100 p-4 rounded-b-2xl">
      {/* Top Input Section */}
      <div className="flex gap-3 mb-6">
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
        <div className="flex-1 relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a public comment..."
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:bg-white min-h-[50px]"
          />
          <div className="flex justify-end mt-2">
            <button 
              onClick={handlePostComment}
              disabled={posting || !newComment.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-white bg-[#5667ff] text-sm font-medium disabled:opacity-50 transition hover:bg-[#4555e5]"
            >
              {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Comment
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Comments Area */}
      <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar space-y-5">
        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-slate-300 h-8 w-8" /></div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400 font-medium">
            No comments yet. Be the first to share your thoughts!
          </div>
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

        {/* Pagination Trigger */}
        {hasMore && !loading && (
          <button 
            onClick={() => {
              const nextPage = page + 1;
              setPage(nextPage);
              fetchComments(nextPage, true);
            }}
            className="w-full py-3 text-sm font-medium text-[#5667ff] hover:bg-[#EEF0FF] rounded-xl transition"
          >
            Load more comments
          </button>
        )}
      </div>
    </div>
  );
}