"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Building2, MapPin, Sparkles, Check, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import VerificationBadge from "@/components/ui/VerificationBadge";

interface Business {
  id: string;
  name: string;
  image: string | null;
  verificationStatus: string;
  type: string;
  location: string | null;
  description: string;
  connectedCount: number;
}

async function loadTopBusinesses(excludeIds?: string[]): Promise<Business[]> {
  const query = excludeIds && excludeIds.length > 0 ? `?exclude=${excludeIds.join(",")}` : "";
  const res = await fetch(`/api/investor/top-businesses${query}`);
  const json = await res.json();
  if (!res.ok || !json.success || !Array.isArray(json.data)) {
    throw new Error(json.message || "Failed to fetch businesses");
  }
  return json.data;
}

export default function TopBusinesses() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    loadTopBusinesses()
      .then((data) => {
        if (active) setBusinesses(data);
      })
      .catch((error) => {
        console.error("Failed to fetch top businesses:", error);
        toast.error("Couldn't load suggested businesses.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleFollow = async (businessId: string) => {
    if (followedIds.has(businessId) || followingIds.has(businessId)) return;
    setFollowingIds((prev) => new Set(prev).add(businessId));
    try {
      const post = () =>
        fetch("/api/network/follow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: businessId }),
        }).then((res) => res.json());

      let json = await post();
      if (json.success && json.isFollowing === false) json = await post();

      if (json.success && json.isFollowing) {
        setFollowedIds((prev) => new Set(prev).add(businessId));
        toast.success("Followed successfully");

        // After a brief moment showing "Followed", remove this card and bring in another business
        setTimeout(() => {
          setBusinesses((current) => {
            const currentIds = current.map((b) => b.id);
            const remaining = current.filter((b) => b.id !== businessId);

            fetch(`/api/investor/top-businesses?limit=1&exclude=${currentIds.join(",")}`)
              .then((res) => res.json())
              .then((newJson) => {
                if (newJson.success && Array.isArray(newJson.data) && newJson.data.length > 0) {
                  const candidate = newJson.data[0];
                  setBusinesses((prev) => {
                    const filtered = prev.filter((b) => b.id !== businessId);
                    if (!filtered.some((b) => b.id === candidate.id)) {
                      return [...filtered, candidate];
                    }
                    return filtered;
                  });
                } else {
                  setBusinesses((prev) => prev.filter((b) => b.id !== businessId));
                }
              })
              .catch(() => {
                setBusinesses((prev) => prev.filter((b) => b.id !== businessId));
              });

            return remaining;
          });
        }, 500);
      } else {
        toast.error(json.message || "Failed to follow");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(businessId);
        return next;
      });
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3.5 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Building2 size={16} />
        </div>
        <h3 className="text-sm font-bold tracking-tight text-gray-900">Top Businesses</h3>
      </div>

      <div className="space-y-5">
        {loading ? (
          <div className="space-y-3" aria-label="Loading businesses">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-14 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/70 p-4 text-center">
            <Sparkles className="mx-auto mb-2 h-5 w-5 text-blue-600" />
            <p className="text-xs font-semibold text-gray-800">No businesses to follow yet</p>
            <p className="mt-1 text-[11px] text-gray-500">
              Businesses you follow will show up in your network feed.
            </p>
          </div>
        ) : (
          businesses.map((business) => (
            <div key={business.id} className="flex items-center gap-3 py-1">
              <Link href={`/profile/${business.id}`} className="shrink-0">
                <div className="relative h-11 w-11 overflow-hidden rounded-lg border border-gray-200 bg-blue-50">
                  {business.image ? (
                    <Image src={business.image} alt={business.name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-blue-700">
                      {business.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/profile/${business.id}`}
                  className="flex items-center gap-1 truncate text-xs font-bold text-gray-900 hover:text-blue-600 hover:underline"
                >
                  <span className="truncate">{business.name}</span>
                  <VerificationBadge status={business.verificationStatus} size="xs" />
                </Link>
                <p className="mt-0.5 truncate text-[11px] text-gray-500">{business.type}</p>
                {business.location && (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-gray-500">
                    <MapPin size={11} className="shrink-0" />
                    {business.location}
                  </p>
                )}
              </div>

              <div className="shrink-0">
                {followedIds.has(business.id) ? (
                  <span className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-500 font-medium text-xs whitespace-nowrap">
                    <Check size={14} /> Followed
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleFollow(business.id)}
                    disabled={followingIds.has(business.id)}
                    className="flex items-center gap-1 px-3 py-1 rounded-full border border-gray-300 text-gray-700 font-medium text-xs whitespace-nowrap hover:bg-gray-100 hover:text-gray-900 hover:border-gray-900 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {followingIds.has(business.id) ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Follow
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
