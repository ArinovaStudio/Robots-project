"use client";


import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bed, Check, X, Loader2 } from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "sonner";
import { mutate } from "swr";

interface ConnectionRequest {
  connectionId: string;
  userId: string;
  companyName: string;
  logoUrl: string | null;
  type: string;
  message: string | null;
  isInvestor?: boolean;
  requestedAt?: string;
}

function timeAgo(dateInput?: string) {
  if (!dateInput) return null;
  const mins = Math.max(0, Math.floor((Date.now() - new Date(dateInput).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function ConnectionRequests() {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "BUSINESS" | "INVESTOR">("ALL");

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
        await mutate("/api/user/counts");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setRespondingId(null);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === "BUSINESS") return !req.isInvestor;
    if (filter === "INVESTOR") return Boolean(req.isInvestor);
    return true;
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="mb-3.5 space-y-2.5">
        <h3 className="text-base font-semibold text-gray-900">Pending Requests</h3>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(["ALL", "BUSINESS", "INVESTOR"] as const).map((t) => {
            const active = filter === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setFilter(filter === t && t !== "ALL" ? "ALL" : t)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition whitespace-nowrap ${
                  active
                    ? "bg-blue-600 text-white shadow-xs font-semibold"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                }`}
              >
                {t === "ALL" ? "All" : t === "BUSINESS" ? "Business" : "Investor"}
              </button>
            );
          })}
        </div>
      </div>

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
        ) : filteredRequests.length === 0 ? (
          /* Empty State */
          <div className="flex h-[120px] flex-col items-center justify-center text-center border-t border-gray-100 pt-2">
            <Bed size={28} className="text-gray-300" strokeWidth={1.5} />
            <p className="mt-3 max-w-[200px] text-sm text-gray-500">
              {filter === "ALL"
                ? "No pending requests"
                : filter === "BUSINESS"
                ? "No pending business requests"
                : "No pending investor requests"}
            </p>
            {filter !== "ALL" && (
              <button
                type="button"
                onClick={() => setFilter("ALL")}
                className="mt-1.5 text-xs font-semibold text-blue-600 hover:underline"
              >
                Show all requests
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => (
              <div key={req.connectionId} className="flex items-center justify-between border-t border-gray-100 pt-3 first:border-0 first:pt-0">
                <div className="flex items-center gap-3 w-full overflow-hidden">
                  <Link href={`/profile/${req.userId}`} className="shrink-0">
                    <div className="h-12 w-12 rounded-full relative overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity">
                      {req.logoUrl ? (
                        <Image alt={req.companyName} src={req.logoUrl} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-400">
                          {req.companyName.charAt(0)}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 overflow-hidden pr-2">
                    <Link href={`/profile/${req.userId}`} className="truncate block">
                      <h4 className="text-sm font-semibold text-gray-900 truncate hover:text-blue-600 hover:underline">{req.companyName}</h4>
                    </Link>
                    <div className="flex items-center gap-1.5 truncate">
                      <p className="text-xs text-gray-500 truncate">{req.type}</p>
                      {req.isInvestor && (
                        <span className="rounded bg-white px-1.5 py-0.5 text-[9px] font-bold text-[#2563EB] border border-blue-200 shrink-0">
                          Investor
                        </span>
                      )}
                    </div>
                    {req.requestedAt && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {timeAgo(req.requestedAt)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    disabled={respondingId === req.connectionId}
                    onClick={() => handleResponse(req.connectionId, "REJECTED")}
                    className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white border border-gray-400 text-gray-700 hover:bg-gray-100 hover:border-gray-600 hover:text-gray-900 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                    title="Ignore invitation"
                    aria-label="Ignore invitation"
                  >
                    {respondingId === req.connectionId ? <Loader2 size={16} className="animate-spin" /> : <X size={18} strokeWidth={2} />}
                  </button>
                  <button
                    disabled={respondingId === req.connectionId}
                    onClick={() => handleResponse(req.connectionId, "ACCEPTED")}
                    className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white border border-[#0a66c2] text-[#0a66c2] hover:bg-blue-50 hover:border-blue-700 hover:text-[#004182] transition disabled:opacity-50 cursor-pointer shadow-2xs"
                    title="Accept invitation"
                    aria-label="Accept invitation"
                  >
                    {respondingId === req.connectionId ? <Loader2 size={16} className="animate-spin" /> : <Check size={18} strokeWidth={2.2} />}
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