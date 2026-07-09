"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Loader2, Users, UserCheck } from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "sonner";
import NetworkCard from "@/components/network/network-card";

type TabType = "followers" | "following";

export default function NetworkPage() {
  const [activeTab, setActiveTab] = useState<TabType>("followers");
  
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  
  const [totalFollowers, setTotalFollowers] = useState<number>(0);
  const [totalFollowing, setTotalFollowing] = useState<number>(0);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  
  const [followersPage, setFollowersPage] = useState(1);
  const [followingPage, setFollowingPage] = useState(1);
  const [hasMoreFollowers, setHasMoreFollowers] = useState(true);
  const [hasMoreFollowing, setHasMoreFollowing] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreNodeRef = useRef<HTMLDivElement | null>(null);

  const fetchNetworkData = useCallback(async (tab: TabType, pageNum: number, append = false) => {
    if (append) setLoadingMore(true);
    else if (!append && pageNum === 1) setLoading(true);

    try {
      const res = await fetch(`/api/network/${tab}?page=${pageNum}&limit=15`);
      const json = await res.json();

      if (json.success) {
        const hasMore = pageNum < json.pagination.totalPages;

        if (tab === "followers") {
          if (append) setFollowers(prev => [...prev, ...json.data]);
          else setFollowers(json.data);
          setHasMoreFollowers(hasMore);
          setTotalFollowers(json.pagination.total);
        } else {
          if (append) setFollowing(prev => [...prev, ...json.data]);
          else setFollowing(json.data);
          setHasMoreFollowing(hasMore);
          setTotalFollowing(json.pagination.total);
        }
      }
    } catch (error) {
      console.error(`Failed to load ${tab}`, error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchNetworkData("followers", 1);
    fetchNetworkData("following", 1);
  }, [fetchNetworkData]);

  useEffect(() => {
    const hasMore = activeTab === "followers" ? hasMoreFollowers : hasMoreFollowing;
    if (loading || loadingMore || !hasMore) return;

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting) {
        if (activeTab === "followers") {
          const nextPage = followersPage + 1;
          setFollowersPage(nextPage);
          fetchNetworkData("followers", nextPage, true);
        } else {
          const nextPage = followingPage + 1;
          setFollowingPage(nextPage);
          fetchNetworkData("following", nextPage, true);
        }
      }
    };

    observerRef.current = new IntersectionObserver(handleObserver, { root: null, rootMargin: "200px", threshold: 0 });
    if (loadMoreNodeRef.current) observerRef.current.observe(loadMoreNodeRef.current);
    
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, [activeTab, hasMoreFollowers, hasMoreFollowing, loading, loadingMore, followersPage, followingPage, fetchNetworkData]);

  const handleFollowToggle = async (targetUserId: string, isFollowingList: boolean) => {
    setActionLoading(prev => ({ ...prev, [targetUserId]: true }));
    try {
      const res = await fetch("/api/network/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        if (isFollowingList) {
          setFollowing(prev => prev.filter(user => user.userId !== targetUserId));
          setTotalFollowing(prev => Math.max(0, prev - 1));
        } else {
          setFollowers(prev => prev.map(user => user.userId === targetUserId ? { ...user, isFollowing: data.isFollowing } : user));
          setTotalFollowing(prev => data.isFollowing ? prev + 1 : Math.max(0, prev - 1));
        }
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to update follow status.");
    } finally {
      setActionLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  const currentData = activeTab === "followers" ? followers : following;
  const hasMoreCurrent = activeTab === "followers" ? hasMoreFollowers : hasMoreFollowing;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Users className="text-[#5667ff]" /> My Network
        </h1>
        
        <div className="flex gap-6 border-b border-slate-100">
          <button 
            onClick={() => setActiveTab("followers")}
            className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === "followers" ? "text-[#5667ff]" : "text-slate-500 hover:text-slate-800"}`}
          >
            Followers <span className="ml-1 opacity-70">({totalFollowers})</span>
            {activeTab === "followers" && <span className="absolute bottom-0 left-0 w-full h-1 bg-[#5667ff] rounded-t-full"></span>}
          </button>
          <button 
            onClick={() => setActiveTab("following")}
            className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === "following" ? "text-[#5667ff]" : "text-slate-500 hover:text-slate-800"}`}
          >
            Following <span className="ml-1 opacity-70">({totalFollowing})</span>
            {activeTab === "following" && <span className="absolute bottom-0 left-0 w-full h-1 bg-[#5667ff] rounded-t-full"></span>}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading && !loadingMore ? (
          <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white p-5 rounded-[24px] border border-slate-50 shadow-sm flex items-center gap-4">
                <Skeleton circle width={64} height={64} />
                <div className="flex-1"><Skeleton width="40%" height={20} /><Skeleton width="20%" height={14} className="mt-2" /></div>
              </div>
            ))}
          </SkeletonTheme>
        ) : currentData.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm">
            <UserCheck className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No {activeTab} yet</h3>
            <p className="text-slate-500 mt-1 text-sm">{activeTab === "followers" ? "When companies follow you, they'll appear here." : "You aren't following anyone yet. Explore the network!"}</p>
          </div>
        ) : (
          <>
            {currentData.map((item) => (
              <NetworkCard 
                key={item.followId} 
                item={item} 
                activeTab={activeTab} 
                actionLoading={actionLoading[item.userId] || false} 
                onToggleFollow={handleFollowToggle} 
              />
            ))}

            {hasMoreCurrent && (
              <div ref={loadMoreNodeRef} className="flex justify-center pt-6 pb-2">
                {loadingMore && <div className="flex items-center gap-2 text-slate-400 text-sm font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100"><Loader2 className="animate-spin h-4 w-4" /> Loading more...</div>}
              </div>
            )}
            
            {!hasMoreCurrent && currentData.length > 0 && (
              <div className="text-center py-6 text-sm font-medium text-slate-400">You've reached the end of the list.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}