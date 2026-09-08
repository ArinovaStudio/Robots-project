"use client";

import { useEffect, useState } from "react";
import ConnectionRequests from "@/components/home/connection-requests";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { UserMinus, UserCheck, Clock, Send, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

export default function NetworkPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "sent" | "connections">("connections");
  const [connections, setConnections] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const [connectionPage, setConnectionPage] = useState(1);
  const [hasMoreConnections, setHasMoreConnections] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchNetworkData = async () => {
    setLoading(true);
    try {
      // In a real scenario, this would hit different endpoints or one grouped endpoint
      // For now we'll simulate fetching accepted connections and sent requests
      const res = await fetch(`/api/network/connect/connections?page=1&limit=15`);
      const json = await res.json();
      if (json.success) {
        setConnections(json.data);
        setHasMoreConnections(json.pagination?.page < json.pagination?.totalPages);
        setConnectionPage(1);
      }
      
      const sentRes = await fetch(`/api/network/connect/sent`);
      const sentJson = await sentRes.json();
      if (sentJson.success) {
        setSentRequests(sentJson.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadMoreConnections = async () => {
    if (loadingMore || !hasMoreConnections) return;
    setLoadingMore(true);
    try {
      const nextPage = connectionPage + 1;
      const res = await fetch(`/api/network/connect/connections?page=${nextPage}&limit=15`);
      const json = await res.json();
      if (json.success) {
        setConnections(prev => [...prev, ...json.data]);
        setHasMoreConnections(json.pagination?.page < json.pagination?.totalPages);
        setConnectionPage(nextPage);
      }
    } catch {
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDisconnect = async (userId: string) => {
    setDisconnectingId(userId);
    try {
      const res = await fetch("/api/network/connect/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Disconnected successfully");
        setConnections((prev) => prev.filter(c => c.userId !== userId));
      } else {
        toast.error(data.message || "Failed to disconnect");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setDisconnectingId(null);
    }
  };

  useEffect(() => {
    if (activeTab === "connections" || activeTab === "sent") {
      fetchNetworkData();
    }
  }, [activeTab]);

  return (
    <section className="mx-auto max-w-6xl space-y-6 pb-20">
      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-1 shadow-sm flex items-center">
        <button
          onClick={() => setActiveTab("pending")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-all ${
            activeTab === "pending" 
              ? "bg-blue-50 text-blue-700 shadow-sm" 
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Clock className="w-5 h-5" />
          Pending Requests
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-all ${
            activeTab === "sent" 
              ? "bg-blue-50 text-blue-700 shadow-sm" 
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Send className="w-5 h-5" />
          Sent Requests
        </button>
        <button
          onClick={() => setActiveTab("connections")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-all ${
            activeTab === "connections" 
              ? "bg-blue-50 text-blue-700 shadow-sm" 
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Users className="w-5 h-5" />
          My Connections
        </button>
      </div>

      {activeTab === "pending" && (
        <div className="mt-4">
          <ConnectionRequests />
        </div>
      )}

      {activeTab === "sent" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Sent Requests</h2>
          {loading ? (
            <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg">
                    <Skeleton circle width={48} height={48} />
                    <div className="flex-1">
                      <Skeleton width="40%" height={16} />
                      <Skeleton width="20%" height={12} className="mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            </SkeletonTheme>
          ) : sentRequests?.length === 0 || !sentRequests ? (
            <div className="text-center py-12 text-gray-500">
              <Send className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>You haven't sent any connection requests yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sentRequests.map((req) => (
                <div key={req.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {req.receiver?.name?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-semibold text-gray-900 truncate">{req.receiver?.name}</h3>
                    <p className="text-sm text-gray-500 truncate">Status: Pending</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "connections" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Your Connections</h2>
          {loading ? (
            <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg">
                    <Skeleton circle width={48} height={48} />
                    <div className="flex-1">
                      <Skeleton width="60%" height={16} />
                      <Skeleton width="40%" height={12} className="mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            </SkeletonTheme>
          ) : connections?.length === 0 || !connections ? (
            <div className="text-center py-12 text-gray-500">
              <UserMinus className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>You don't have any connections yet. Start exploring the directory to find partners!</p>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              {connections.map((conn) => (
                <div key={conn.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition">
                  <Link href={`/profile/${conn.userId}`} className="shrink-0">
                    <div className="w-14 h-14 rounded-full relative overflow-hidden bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg border border-gray-200">
                      {conn.image ? (
                        <Image src={conn.image} alt={conn.name} fill className="object-cover" />
                      ) : (
                        conn.name?.charAt(0) || "U"
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 overflow-hidden">
                    <Link href={`/profile/${conn.userId}`} className="hover:underline">
                      <h3 className="font-semibold text-gray-900 truncate">{conn.name}</h3>
                    </Link>
                    <p className="text-sm text-gray-500 truncate">{conn.company?.type || "Member"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Connected {new Date(conn.connectedAt).toLocaleDateString()}</p>
                  </div>
                  <button 
                    disabled={disconnectingId === conn.userId}
                    onClick={() => handleDisconnect(conn.userId)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-red-600 hover:border-red-600 transition-colors disabled:opacity-50"
                  >
                    {disconnectingId === conn.userId ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserMinus className="w-4 h-4" />}
                    <span className="hidden sm:inline">Disconnect</span>
                  </button>
                </div>
              ))}

              {hasMoreConnections && (
                <div className="flex justify-center mt-6">
                  <button 
                    onClick={loadMoreConnections}
                    disabled={loadingMore}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Load More
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
