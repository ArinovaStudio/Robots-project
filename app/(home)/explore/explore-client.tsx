"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import AchievementPost from "@/components/home/achievements-post";
import FeedCard from "@/components/home/feed-card";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useUserStore } from "@/store/AuthStore";
import { useSession } from "next-auth/react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useNewConnectionPosts } from "@/hooks/useNewConnectionPosts";
import NewPostsPill from "@/components/home/new-posts-pill";

type FeedTab = "foryou" | "network";

const TABS: { id: FeedTab; label: string }[] = [
  { id: "foryou", label: "For you" },
  { id: "network", label: "Network" },
];

export default function ExploreClient() {
  const { user } = useUserStore();
  const { status } = useSession();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedTab>("foryou");
  const requestId = useRef(0);

  const { ref, isIntersecting } = useIntersectionObserver({ rootMargin: '200px' });
  const { count: newPostsCount, reset: resetNewPosts } = useNewConnectionPosts(
  status === "authenticated" && !!user?.id && !loading
);

  const fetchFeed = useCallback(async (pageNum: number, append = false) => {
    const thisRequest = ++requestId.current;
    if (append) {
      setLoadingMore(true);
      setPage(pageNum);
    } else {
      setLoading(true);
      setPosts([]);
      setHasMore(true);
      setPage(1);
    }
    
    try {
      const res = await fetch(`/api/user/feed/explore?page=${pageNum}&limit=15&tab=${activeTab}`);
      const json = await res.json();
      if (thisRequest !== requestId.current) return; // a newer request (e.g. tab switch) replaced this one
      
      if (json.success) {
        if (append) {
          setPosts(prev => {
            const combined = [...prev, ...json.data];
            const unique = Array.from(new Map(combined.map(p => [p.id, p])).values());
            return unique;
          });
        } else {
          const unique = Array.from(new Map(json.data.map((p: any) => [p.id, p])).values());
          setPosts(unique);
        }
        setHasMore(pageNum < json.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to load feed", error);
    } finally {
      if (thisRequest === requestId.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    if (status === "authenticated" && user?.id && isIntersecting && hasMore && !loading && !loadingMore) {
      const nextPage = page + 1;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchFeed(nextPage, true);
    }
  }, [status, user?.id, isIntersecting, hasMore, loading, loadingMore, page, fetchFeed]);

  useEffect(() => {
    if (status === "authenticated" && user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchFeed(1);
    }
  }, [status, user?.id, fetchFeed]);
const showNewPosts = () => {
  resetNewPosts();
  window.scrollTo({ top: 0, behavior: "smooth" });
  fetchFeed(1);
};
  return (
    <div className="space-y-5 pb-20">
      <h1 className="sr-only">Connecto B2B Feed & Updates</h1>
      <NewPostsPill count={newPostsCount} onClick={showNewPosts} />

      <div className="flex gap-2 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ScrollReveal direction="down">
        <AchievementPost />
      </ScrollReveal>
      
      {status === "unauthenticated" ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white py-10 text-center text-slate-500">
          <Link href="/login" className="font-medium text-blue-700 hover:underline">Sign in</Link> to view the explore feed.
        </div>
      ) : loading || status === "loading" || (status === "authenticated" && !user?.id) ? (
        <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
          {[1, 2, 3].map((i) => (
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
        <div className="text-center py-10 text-slate-500 bg-white rounded-3xl border border-slate-200/80">
          {activeTab === "network"
            ? "No posts from your connections yet. Connect with more people to fill this feed!"
            : "No posts to show yet."}
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <ScrollReveal key={post.id} direction="up" delay={0.1}>
              {post.connectionActivity && (
                <p className="mb-1.5 px-2 text-xs font-medium text-slate-500">
                  <span className="font-semibold text-slate-700">{post.connectionActivity.name}</span>{" "}
                  {post.connectionActivity.type === "COMMENTED" ? "commented on this" : "reacted to this"}
                </p>
              )}
              <FeedCard 
                post={post} 
                currentUser={user} 
              />
            </ScrollReveal>
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
              You&apos;ve caught up on all posts!
            </div>
          )}
        </>
      )}
    </div>
  );
}
