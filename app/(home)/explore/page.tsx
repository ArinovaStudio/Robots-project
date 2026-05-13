"use client";

import { useEffect, useState } from "react";
import AchievementPost from "@/components/home/achievements-post";
import FeedCard from "@/components/home/feed-card";
import { useSession } from "next-auth/react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true);
    
    try {
      const res = await fetch(`/api/user/feed/explore?page=${pageNum}&limit=15`);
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
      console.error("Failed to load feed", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFeed(1);
  }, []);

  return (
    <div className="space-y-5 pb-20">
      <AchievementPost />
      
      {loading ? (
        // Initial Loading Skeletons
        <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col rounded-2xl bg-white p-4 border border-slate-100 shadow-sm space-y-4">
              {/* Header Skeleton */}
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
              {/* Media Block Skeleton */}
              <Skeleton height={250} borderRadius={16} />
              {/* Actions Skeleton */}
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((a) => (
                  <Skeleton key={a} height={36} className="flex-1" borderRadius={999} />
                ))}
              </div>
            </div>
          ))}
        </SkeletonTheme>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 text-slate-500 bg-white rounded-3xl border border-slate-200/80">
          No posts to show yet. Follow some companies to build your feed!
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <FeedCard 
              key={post.id} 
              post={post} 
              currentUser={session?.user} 
            />
          ))}

          {/* Load More Section */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              {loadingMore ? (
                <div className="w-full max-w-[200px]">
                  <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
                    <Skeleton height={44} borderRadius={999} />
                  </SkeletonTheme>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchFeed(nextPage, true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition shadow-sm"
                >
                  Load More Posts
                </button>
              )}
            </div>
          )}

          {!hasMore && posts.length > 0 && (
            <div className="text-center py-8 text-sm font-medium text-slate-400">
              You&apos;ve caught up on all posts!
            </div>
          )}
        </>
      )}
    </div>
  );
}