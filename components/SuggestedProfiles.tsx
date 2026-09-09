"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import ConnectModal from "./modals/connect-modal";
import { toast } from "sonner"; 
import { Plus } from "lucide-react";

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
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Add to your feed</h3>

      <div className="space-y-4">
        {loading ? (
          <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton circle width={48} height={48} />
                <div className="flex-1">
                  <Skeleton width="60%" height={14} />
                  <Skeleton width="80%" height={10} className="mt-1" />
                  <Skeleton width={80} height={30} borderRadius={999} className="mt-2" />
                </div>
              </div>
            ))}
          </SkeletonTheme>
        ) : matches.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">No matches found yet.</p>
        ) : (
          matches.map((company) => (
            <div
              key={company.userId}
              className="flex gap-3"
            >
              <div className="h-12 w-12 rounded-full relative overflow-hidden bg-gray-100 shrink-0">
                {company.logoUrl ? (
                  <Image
                    alt={company.companyName}
                    src={company.logoUrl}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-400">
                    {company.companyName.charAt(0)}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-start w-full overflow-hidden">
                <div className="flex items-center gap-1.5 w-full">
                  <h4 className="text-sm font-semibold text-gray-900 truncate hover:text-blue-600 hover:underline cursor-pointer">{company.companyName}</h4>
                  {company.isBoosted && (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 rounded font-medium">
                      Ad
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate w-full mb-2">{company.type}</p>
                
                <button
                  onClick={() => setSelectedCompany(company)}
                  className="flex items-center gap-1 px-4 py-1.5 rounded-full border border-gray-500 text-gray-600 font-medium text-sm hover:bg-gray-100 hover:text-gray-900 hover:border-gray-900 transition-colors"
                >
                  <Plus size={16} /> Connect
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && matches.length > 0 && (
        <button className="mt-4 text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 group">
          View all recommendations <span className="group-hover:translate-x-1 transition-transform">→</span>
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