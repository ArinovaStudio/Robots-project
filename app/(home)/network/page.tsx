"use client";

import { useEffect, useState } from "react";
import ConnectionRequests from "@/components/home/connection-requests";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { UserMinus, UserCheck, Clock, Send, Users } from "lucide-react";

export default function NetworkPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "sent" | "connections">("pending");
  const [connections, setConnections] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNetworkData = async () => {
    setLoading(true);
    try {
      // In a real scenario, this would hit different endpoints or one grouped endpoint
      // For now we'll simulate fetching accepted connections and sent requests
      const res = await fetch(`/api/network/connections`);
      const json = await res.json();
      if (json.success) {
        setConnections(json.data);
      }
      
      const sentRes = await fetch(`/api/network/sent`);
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((conn) => (
                <div key={conn.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {conn.name?.charAt(0) || "U"}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-semibold text-gray-900 truncate">{conn.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{conn.company?.companyName || "Member"}</p>
                  </div>
                  <button className="text-gray-400 hover:text-blue-600">
                    <UserCheck className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
