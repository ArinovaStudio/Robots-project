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
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Requests for connections</h3>

      <div className="mt-4">
        {loading ? (
          <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-2.5 flex-1">
                  <Skeleton circle width={36} height={36} />
                  <div className="flex-1 pl-2">
                    <Skeleton width="70%" height={12} />
                    <Skeleton width="40%" height={8} />
                  </div>
                </div>
                <div className="flex gap-2">
                   <Skeleton width={28} height={28} borderRadius={14} />
                   <Skeleton width={28} height={28} borderRadius={14} />
                </div>
              </div>
            ))}
          </SkeletonTheme>
        ) : requests.length === 0 ? (
          /* Empty State */
          <div className="flex h-[140px] flex-col items-center justify-center text-center">
            <Bed size={28} className="text-slate-300" strokeWidth={1.5} />
            <p className="mt-4 max-w-[180px] text-xs leading-5 text-slate-400">
              No one has requested to connect with you
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.connectionId} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-none last:pb-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full relative overflow-hidden bg-slate-50">
                    {req.logoUrl ? (
                      <Image alt={req.companyName} src={req.logoUrl} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
                        {req.companyName.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 truncate max-w-[120px]">{req.companyName}</h4>
                    <p className="text-[10px] text-slate-400">{req.type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={respondingId === req.connectionId}
                    onClick={() => handleResponse(req.connectionId, "ACCEPTED")}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600 transition hover:bg-green-100 disabled:opacity-50"
                    title="Accept"
                  >
                    {respondingId === req.connectionId ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                  </button>
                  <button
                    disabled={respondingId === req.connectionId}
                    onClick={() => handleResponse(req.connectionId, "REJECTED")}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
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