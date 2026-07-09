"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Loader2, Link as LinkIcon, UserPlus } from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "sonner";
import ConnectionCard from "@/components/network/connection-card";
import PendingCard from "@/components/network/pending-card";

type TabType = "connections" | "pending";

export default function ConnectionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("connections");
  
  const [connections, setConnections] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  
  const [totalConnections, setTotalConnections] = useState<number>(0);
  const [totalPending, setTotalPending] = useState<number>(0);
  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  
  const [connectionsPage, setConnectionsPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [hasMoreConnections, setHasMoreConnections] = useState(true);
  const [hasMorePending, setHasMorePending] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreNodeRef = useRef<HTMLDivElement | null>(null);

  const fetchData = useCallback(async (tab: TabType, pageNum: number, append = false) => {
    if (append) setLoadingMore(true);
    else if (!append && pageNum === 1) setLoading(true);

    try {
      const res = await fetch(`/api/network/connect/${tab}?page=${pageNum}&limit=15`);
      const json = await res.json();

      if (json.success) {
        const hasMore = pageNum < json.pagination.totalPages;

        if (tab === "connections") {
          if (append) setConnections(prev => [...prev, ...json.data]);
          else setConnections(json.data);
          setHasMoreConnections(hasMore);
          setTotalConnections(json.pagination.total);
        } else {
          if (append) setPending(prev => [...prev, ...json.data]);
          else setPending(json.data);
          setHasMorePending(hasMore);
          setTotalPending(json.pagination.total);
        }
      }
    } catch (error) {
      console.error(`Failed to load ${tab}`, error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Fetch both counts instantly on load
  useEffect(() => {
    fetchData("connections", 1);
    fetchData("pending", 1);
  }, [fetchData]);

  // Infinite Scroll setup
  useEffect(() => {
    const hasMore = activeTab === "connections" ? hasMoreConnections : hasMorePending;
    if (loading || loadingMore || !hasMore) return;

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting) {
        if (activeTab === "connections") {
          const nextPage = connectionsPage + 1;
          setConnectionsPage(nextPage);
          fetchData("connections", nextPage, true);
        } else {
          const nextPage = pendingPage + 1;
          setPendingPage(nextPage);
          fetchData("pending", nextPage, true);
        }
      }
    };

    observerRef.current = new IntersectionObserver(handleObserver, { root: null, rootMargin: "200px", threshold: 0 });
    if (loadMoreNodeRef.current) observerRef.current.observe(loadMoreNodeRef.current);
    
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, [activeTab, hasMoreConnections, hasMorePending, loading, loadingMore, connectionsPage, pendingPage, fetchData]);

  // Handle Removing an active connection
  const handleRemove = async (targetUserId: string) => {
    setActionLoading(prev => ({ ...prev, [targetUserId]: true }));
    try {
      const res = await fetch("/api/network/connect/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        setConnections(prev => prev.filter(c => c.userId !== targetUserId));
        setTotalConnections(prev => Math.max(0, prev - 1));
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to remove connection.");
    } finally {
      setActionLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  // Handle Accepting/Rejecting a pending request
  const handleRespond = async (connectionId: string, action: "ACCEPTED" | "REJECTED") => {
    setActionLoading(prev => ({ ...prev, [connectionId]: true }));
    try {
      const res = await fetch("/api/network/connect/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, action })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        
        // Remove from pending list
        const acceptedUser = pending.find(p => p.connectionId === connectionId);
        setPending(prev => prev.filter(p => p.connectionId !== connectionId));
        setTotalPending(prev => Math.max(0, prev - 1));

        // If accepted, explicitly fetch the connections list again to move them over
        if (action === "ACCEPTED") {
          fetchData("connections", 1);
        }
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to process request.");
    } finally {
      setActionLoading(prev => ({ ...prev, [connectionId]: false }));
    }
  };

  const currentData = activeTab === "connections" ? connections : pending;
  const hasMoreCurrent = activeTab === "connections" ? hasMoreConnections : hasMorePending;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <LinkIcon className="text-[#5667ff]" /> Connections
        </h1>
        
        <div className="flex gap-6 border-b border-slate-100">
          <button 
            onClick={() => setActiveTab("connections")}
            className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === "connections" ? "text-[#5667ff]" : "text-slate-500 hover:text-slate-800"}`}
          >
            My Connections <span className="ml-1 opacity-70">({totalConnections})</span>
            {activeTab === "connections" && <span className="absolute bottom-0 left-0 w-full h-1 bg-[#5667ff] rounded-t-full"></span>}
          </button>
          <button 
            onClick={() => setActiveTab("pending")}
            className={`pb-4 px-2 text-sm font-bold transition-all relative flex items-center gap-2 ${activeTab === "pending" ? "text-[#5667ff]" : "text-slate-500 hover:text-slate-800"}`}
          >
            Pending Requests
            {totalPending > 0 && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] rounded-full">
                {totalPending}
              </span>
            )}
            {activeTab === "pending" && <span className="absolute bottom-0 left-0 w-full h-1 bg-[#5667ff] rounded-t-full"></span>}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading && !loadingMore ? (
          <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-5 rounded-[24px] border border-slate-50 shadow-sm flex items-center gap-4">
                <Skeleton circle width={64} height={64} />
                <div className="flex-1"><Skeleton width="40%" height={20} /><Skeleton width="20%" height={14} className="mt-2" /></div>
              </div>
            ))}
          </SkeletonTheme>
        ) : currentData.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm">
            <UserPlus className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">No {activeTab}</h3>
            <p className="text-slate-500 mt-1 text-sm">
              {activeTab === "connections" 
                ? "You haven't established any business connections yet." 
                : "You don't have any pending connection requests."}
            </p>
          </div>
        ) : (
          <>
            {activeTab === "connections" ? (
              currentData.map((item) => (
                <ConnectionCard 
                  key={item.connectionId} 
                  item={item} 
                  actionLoading={actionLoading[item.userId] || false} 
                  onRemove={handleRemove} 
                />
              ))
            ) : (
              currentData.map((item) => (
                <PendingCard 
                  key={item.connectionId} 
                  item={item} 
                  actionLoading={actionLoading[item.connectionId] || false} 
                  onRespond={handleRespond} 
                />
              ))
            )}

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