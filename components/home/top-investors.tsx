"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Plus, Check, Clock, TrendingUp, Sparkles, MessageSquare, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ConnectModal from "@/components/modals/connect-modal";
import VerificationBadge from "@/components/ui/VerificationBadge";

interface TopInvestor {
  id: string;
  name: string;
  image: string | null;
  verificationStatus: string;
  firmName: string | null;
  investorType: string;
  sectors: string[];
  investmentRange: string | null;
  location: string | null;
  connectedCount: number;
  connectionStatus: string | null;
  connectionId?: string | null;
}

export default function TopInvestors() {
  const [investors, setInvestors] = useState<TopInvestor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvestor, setSelectedInvestor] = useState<TopInvestor | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopInvestors = async () => {
      try {
        const res = await fetch("/api/investor/top");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setInvestors(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch top investors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopInvestors();
  }, []);

  const handleConnectSuccess = (msg: string) => {
    toast.success(msg);
    if (selectedInvestor) {
      setInvestors((prev) =>
        prev.map((inv) =>
          inv.id === selectedInvestor.id ? { ...inv, connectionStatus: "PENDING" } : inv
        )
      );
    }
  };

  const handleCancelRequest = async (investorId: string, connectionId?: string | null) => {
    setCancellingId(investorId);
    try {
      const res = await fetch("/api/network/connect/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: investorId, connectionId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Connection request cancelled");
        setInvestors((prev) =>
          prev.map((inv) =>
            inv.id === investorId ? { ...inv, connectionStatus: null, connectionId: null } : inv
          )
        );
      } else {
        toast.error(data.message || "Failed to cancel request");
      }
    } catch {
      toast.error("Failed to cancel request");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp size={16} />
          </div>
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">Top Investors</h3>
        </div>
        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
          Active
        </span>
      </div>

      <div className="space-y-3.5">
        {loading ? (
          <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton circle width={44} height={44} />
                <div className="flex-1">
                  <Skeleton width="65%" height={13} />
                  <Skeleton width="45%" height={10} className="mt-1" />
                  <Skeleton width={70} height={26} borderRadius={999} className="mt-2" />
                </div>
              </div>
            ))}
          </SkeletonTheme>
        ) : investors.length === 0 ? (
          <div className="rounded-lg bg-gray-50/70 p-4 text-center border border-dashed border-gray-200">
            <div className="mx-auto w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <Sparkles size={18} />
            </div>
            <p className="text-xs font-semibold text-gray-800">Discover Investors</p>
            <p className="text-[11px] text-gray-500 mt-1 max-w-[200px] mx-auto leading-normal">
              Explore the investor matchmaking directory to find venture partners.
            </p>
            <Link
              href="/investors/portal"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Browse Investor Portal →
            </Link>
          </div>
        ) : (
          investors.map((investor) => {
            const subtitle = investor.firmName || investor.investorType || "Investor";
            const tag = investor.investmentRange || investor.sectors[0] || null;

            return (
              <div key={investor.id} className="flex gap-3 items-start group">
                <Link href={`/profile/${investor.id}`} className="shrink-0">
                  <div className="h-11 w-11 rounded-full relative overflow-hidden bg-[#EFF6FF] border border-[#E5E7EB] cursor-pointer hover:opacity-90 transition-opacity">
                    {investor.image ? (
                      <Image
                        alt={investor.name}
                        src={investor.image}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#2563EB]">
                        {investor.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex flex-col items-start w-full min-w-0">
                  <div className="flex items-center gap-1 w-full min-w-0">
                    <Link
                      href={`/profile/${investor.id}`}
                      className="truncate text-xs font-bold text-gray-900 hover:text-blue-600 hover:underline cursor-pointer flex items-center gap-1 min-w-0"
                    >
                      <span className="truncate">{investor.name}</span>
                      <VerificationBadge status={investor.verificationStatus} size="xs" />
                    </Link>
                  </div>

                  <p className="text-[11px] text-gray-500 truncate w-full mt-0.5">
                    {subtitle}
                  </p>

                  {tag && (
                    <span className="mt-1 inline-block text-[10px] font-medium text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-md truncate max-w-full">
                      {tag}
                    </span>
                  )}

                  <div className="mt-2">
                    {investor.connectionStatus === "ACCEPTED" ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
                          <Check size={12} /> Connected
                        </span>
                        <Link
                          href={`/messages/${investor.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-600 text-white font-medium text-[11px] hover:bg-blue-700 transition"
                        >
                          <MessageSquare size={11} /> Message
                        </Link>
                      </div>
                    ) : investor.connectionStatus === "PENDING" ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium text-[11px] border border-amber-200">
                          <Clock size={12} /> Pending
                        </span>
                        <button
                          onClick={() => handleCancelRequest(investor.id, investor.connectionId)}
                          disabled={cancellingId === investor.id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-red-600 bg-red-50 hover:bg-red-100 text-[11px] font-semibold border border-red-200 transition disabled:opacity-50"
                          title="Cancel connection request"
                        >
                          {cancellingId === investor.id ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedInvestor(investor)}
                        className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-300 text-gray-700 font-medium text-xs hover:bg-gray-100 hover:text-gray-900 hover:border-gray-900 transition-colors"
                      >
                        <Plus size={14} /> Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && investors.length > 0 && (
        <Link
          href="/investors/portal"
          className="mt-3.5 text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1 group block w-full text-center py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
        >
          View Investor Portal <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </Link>
      )}

      {selectedInvestor && (
        <ConnectModal
          receiverId={selectedInvestor.id}
          companyName={selectedInvestor.name}
          onClose={() => setSelectedInvestor(null)}
          onSuccess={handleConnectSuccess}
        />
      )}
    </div>
  );
}
