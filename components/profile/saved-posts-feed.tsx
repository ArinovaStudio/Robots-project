"use client";

import { useEffect, useState, useCallback } from "react";
import FeedCard from "@/components/home/feed-card";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useUserStore } from "@/store/AuthStore";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

export default function SavedPostsFeed() {
  const { user } = useUserStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { ref, isIntersecting } = useIntersectionObserver({ rootMargin: '200px' });

  const fetchFeed = useCallback(async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true);
    
    try {
      const res = await fetch(`/api/user/saved-posts?page=${pageNum}&limit=15`);
      const json = await res.json();
      
      if (json.success) {
        if (append) {
          setPosts(prev => [...prev, ...json.data]);
        } else {
          setPosts(json.data);
        }
        setHasMore(pageNum < json.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to load saved posts", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (isIntersecting && hasMore && !loading && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage, true);
    }
  }, [isIntersecting, hasMore, loading, loadingMore, page, fetchFeed]);

  useEffect(() => {
    fetchFeed(1);
  }, [fetchFeed]);

  const handleRemovePost = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  return (
    <div className="space-y-5 pb-20 mt-6">
      {loading ? (
        <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
          {[1, 2].map((i) => (
            <div key={i} className="flex flex-col rounded-2xl bg-white p-4 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton circle width={40} height={40} />
                <div className="flex-1">
                  <Skeleton width="40%" height={14} />
                  <Skeleton width="25%" height={10} className="mt-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton count={3} height={12} />
              </div>
              <Skeleton height={250} borderRadius={16} />
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((a) => (
                  <Skeleton key={a} height={36} className="flex-1" borderRadius={999} />
                ))}
              </div>
            </div>
          ))}
        </SkeletonTheme>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 text-slate-500 bg-white rounded-3xl border border-slate-100 shadow-sm">
          You haven't saved any posts yet.
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <FeedCard 
              key={post.id} 
              post={post} 
              currentUser={user} 
              onUnsave={() => handleRemovePost(post.id)} 
            />
          ))}

          {hasMore && (
            <div ref={ref} className="flex justify-center pt-4">
              {loadingMore && (
                <div className="w-full max-w-[200px]">
                  <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
                    <Skeleton height={44} borderRadius={999} />
                  </SkeletonTheme>
                </div>
              )}
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="text-center py-8 text-sm font-medium text-slate-400">
              End of saved posts.
            </div>
          )}
        </>
      )}
    </div>
  );
}