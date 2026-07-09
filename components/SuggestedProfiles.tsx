"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import ConnectModal from "./modals/connect-modal";
import { toast } from "sonner"; 

interface CompanyMatch {
  userId: string;
  companyName: string;
  logoUrl: string | null;
  type: string;
  isBoosted: boolean;
}

export default function SuggestedProfiles() {
  const [matches, setMatches] = useState<CompanyMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<CompanyMatch | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch("/api/match/suggested");
        const json = await res.json();
        if (json.success) {
          setMatches(json.data.slice(0, 4));
        }
      } catch (error) {
        console.error("Failed to fetch matches", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const handleSuccess = (msg: string) => {
    toast.success(msg);

    if (selectedCompany) {
      setMatches((prev) => prev.filter((c) => c.userId !== selectedCompany.userId));
    }
  };

  return (
    <div className="relative rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Company Matched for you</h3>

      <div className="mt-4 space-y-4">
        {loading ? (
          <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2.5 flex-1">
                  <Skeleton circle width={36} height={36} />
                  <div className="flex-1 pl-2">
                    <Skeleton width="60%" height={14} />
                    <Skeleton width="40%" height={10} />
                  </div>
                </div>
                <Skeleton width={50} height={12} />
              </div>
            ))}
          </SkeletonTheme>
        ) : matches.length === 0 ? (
          <p className="text-xs text-slate-400 py-2 text-center">No matches found yet.</p>
        ) : (
          matches.map((company) => (
            <div
              key={company.userId}
              className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-none last:pb-0"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full relative overflow-hidden bg-slate-50">
                  {company.logoUrl ? (
                    <Image
                      alt={company.companyName}
                      src={company.logoUrl}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
                      {company.companyName.charAt(0)}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-semibold text-slate-800">{company.companyName}</h4>
                    {company.isBoosted && (
                      <span className="text-[8px] bg-indigo-50 text-[#4f46e5] px-1 rounded font-bold uppercase tracking-tighter">
                        AD
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">{company.type}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCompany(company)}
                className="text-xs font-medium text-[#4f46e5] hover:underline"
              >
                Connect
              </button>
            </div>
          ))
        )}
      </div>

      {!loading && matches.length > 0 && (
        <button className="mt-5 w-full text-center text-xs font-medium text-[#4f46e5] hover:underline">
          View All →
        </button>
      )}

      {selectedCompany && (
        <ConnectModal
          receiverId={selectedCompany.userId}
          companyName={selectedCompany.companyName}
          onClose={() => setSelectedCompany(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}