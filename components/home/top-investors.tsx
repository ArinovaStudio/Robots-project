"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Plus, Check, Loader2, TrendingUp, Sparkles } from "lucide-react";
import { toast } from "sonner";
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
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set()); // requests in flight

  useEffect(() => {
    const fetchTopInvestors = async () => {
      try {
        const res = await fetch("/api/investor/top?limit=5");
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

  // Follow stays on the card as "Followed". On the next refresh the API no longer
  // returns followed investors, so that card is replaced by a new one.
  const handleFollow = async (investorId: string) => {
    if (followedIds.has(investorId) || followingIds.has(investorId)) return;
    setFollowingIds((prev) => new Set(prev).add(investorId));
    try {
      const post = () =>
        fetch("/api/network/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: investorId }),
        }).then((res) => res.json());

      let json = await post();
      // the endpoint toggles; if we were already following, it just unfollowed, so follow again
      if (json.success && json.isFollowing === false) json = await post();

      if (json.success && json.isFollowing) {
        setFollowedIds((prev) => new Set(prev).add(investorId));
        toast.success("Followed successfully");
      } else {
        toast.error(json.message || "Failed to follow");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(investorId);
        return next;
      });
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
            {[1, 2, 3, 4, 5].map((i) => (
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

            return (
              <div key={investor.id} className="flex items-center gap-3 group">
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

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/profile/${investor.id}`}
                    className="truncate text-xs font-bold text-gray-900 hover:text-blue-600 hover:underline cursor-pointer flex items-center gap-1 min-w-0"
                  >
                    <span className="truncate">{investor.name}</span>
                    <VerificationBadge status={investor.verificationStatus} size="xs" />
                  </Link>

                  <p className="text-[11px] text-gray-500 truncate w-full mt-0.5">
                    {subtitle}
                  </p>
                </div>

                <div className="shrink-0">
                  {followedIds.has(investor.id) ? (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-500 font-medium text-xs whitespace-nowrap">
                      <Check size={14} /> Followed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleFollow(investor.id)}
                      disabled={followingIds.has(investor.id)}
                      className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-300 text-gray-700 font-medium text-xs whitespace-nowrap hover:bg-gray-100 hover:text-gray-900 hover:border-gray-900 transition-colors disabled:opacity-60"
                    >
                      {followingIds.has(investor.id) ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Follow
                    </button>
                  )}
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

    </div>
  );
}