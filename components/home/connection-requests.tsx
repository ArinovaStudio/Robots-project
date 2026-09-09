"use client";


import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Bed, Check, X, Loader2 } from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "sonner";

interface ConnectionRequest {
  connectionId: string;
  userId: string;
  companyName: string;
  logoUrl: string | null;
  type: string;
  message: string | null;
}

export default function ConnectionRequests() {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/network/connect/pending");
      const json = await res.json();
      if (json.success) {
        setRequests(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch connection requests", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleResponse = async (connectionId: string, action: "ACCEPTED" | "REJECTED") => {
    setRespondingId(connectionId);
    try {
      const res = await fetch("/api/network/connect/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, action }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        setRequests((prev) => prev.filter((req) => req.connectionId !== connectionId));
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mt-4">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Pending Requests</h3>

      <div>
        {loading ? (
          <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton circle width={48} height={48} />
                  <div className="flex-1 pl-1">
                    <Skeleton width="70%" height={12} />
                    <Skeleton width="40%" height={8} className="mt-1" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton width={32} height={32} borderRadius={16} />
                  <Skeleton width={32} height={32} borderRadius={16} />
                </div>
              </div>
            ))}
          </SkeletonTheme>
        ) : requests.length === 0 ? (
          /* Empty State */
          <div className="flex h-[120px] flex-col items-center justify-center text-center border-t border-gray-100 pt-2">
            <Bed size={28} className="text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 max-w-[180px] text-sm text-gray-500">
              No pending requests
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.connectionId} className="flex items-center justify-between border-t border-gray-100 pt-3 first:border-0 first:pt-0">
                <div className="flex items-center gap-3 w-full overflow-hidden">
                  <div className="h-12 w-12 rounded-full relative overflow-hidden bg-gray-100 shrink-0">
                    {req.logoUrl ? (
                      <Image alt={req.companyName} src={req.logoUrl} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-400">
                        {req.companyName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden pr-2">
                    <h4 className="text-sm font-semibold text-gray-900 truncate hover:text-blue-600 hover:underline cursor-pointer">{req.companyName}</h4>
                    <p className="text-xs text-gray-500 truncate">{req.type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    disabled={respondingId === req.connectionId}
                    onClick={() => handleResponse(req.connectionId, "ACCEPTED")}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-600 transition-colors disabled:opacity-50"
                    title="Accept"
                  >
                    {respondingId === req.connectionId ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                  </button>
                  <button
                    disabled={respondingId === req.connectionId}
                    onClick={() => handleResponse(req.connectionId, "REJECTED")}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-red-600 hover:border-red-600 transition-colors disabled:opacity-50"
                    title="Reject"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}