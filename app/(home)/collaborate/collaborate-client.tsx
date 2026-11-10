"use client";

import { useCallback, useEffect, useState } from "react";
import CompanyCard from "@/components/home/search/company-card";
import InvestorCard, { type InvestorCardData } from "@/components/home/investor-card";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Users, Briefcase } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/AuthStore";

type CompanyLike = {
  id: string | number;
  [key: string]: unknown;
};

function InvestorCollaborationClient() {
  const { status } = useSession();
  const user = useUserStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<"suggested" | "similar">("suggested");
  const [companies, setCompanies] = useState<CompanyLike[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async (type: "suggested" | "similar") => {
    setLoading(true);
    setCompanies([]);
    try {
      const res = await fetch(`/api/match/${type}`);
      const json = await res.json();
      if (json.success) {
        setCompanies(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchMatches(activeTab);
    }
  }, [activeTab, status, user?.id, fetchMatches]);

  return (
    <section className="mx-auto max-w-6xl space-y-6 pb-20">
      <h1 className="sr-only">Business Collaboration</h1>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-1 shadow-sm flex items-center">
        <button
          onClick={() => setActiveTab("suggested")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-all ${
            activeTab === "suggested" 
              ? "bg-blue-50 text-blue-700 shadow-sm" 
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Users className="w-5 h-5" />
          Suggested Businesses
        </button>
        <button
          onClick={() => setActiveTab("similar")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-all ${
            activeTab === "similar" 
              ? "bg-blue-50 text-blue-700 shadow-sm" 
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Briefcase className="w-5 h-5" />
          Similar Businesses
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {status === "unauthenticated" ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-lg border border-gray-200 shadow-sm">
            <Link href="/login" className="font-medium text-blue-700 hover:underline">Sign in</Link> to discover businesses.
          </div>
        ) : loading || status === "loading" || (status === "authenticated" && !user?.id) ? (
          <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <div className="flex gap-4">
                  <Skeleton circle width={64} height={64} borderRadius={8} />
                  <div className="flex-1 mt-1">
                    <Skeleton width="40%" height={24} />
                    <Skeleton width="20%" height={14} className="mt-2" />
                  </div>
                </div>
                <div className="mt-5"><Skeleton count={2} /></div>
                <div className="mt-5 grid grid-cols-5 gap-4"><Skeleton count={5} height={36} borderRadius={4} /></div>
              </div>
            ))}
          </SkeletonTheme>
        ) : companies.length === 0 ? (
           <div className="text-center py-20 text-gray-500 bg-white rounded-lg border border-gray-200 shadow-sm">
             No {activeTab === "suggested" ? "suggested businesses" : "similar businesses"} found.
           </div>
        ) : (
          <div className="grid gap-0">
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function BusinessCollaborationClient() {
  const { status } = useSession();
  const user = useUserStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<"suggested" | "similar">("suggested");
  const [investors, setInvestors] = useState<InvestorCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvestors = useCallback(async (type: "suggested" | "similar") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/company/investor-matches?type=${type}`);
      const json = await res.json();
      if (!res.ok || !json.success || !Array.isArray(json.data)) {
        throw new Error(json.message || "Failed to load investor recommendations.");
      }
      setInvestors(json.data);
    } catch (fetchError) {
      console.error("Failed to load investor recommendations:", fetchError);
      setInvestors([]);
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load investor recommendations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchInvestors(activeTab);
    }
  }, [activeTab, status, user?.id, fetchInvestors]);

  return (
    <section className="mx-auto max-w-6xl space-y-6 pb-20">
      <h1 className="sr-only">Business Collaboration</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-1.5 shadow-xs flex items-center gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("suggested")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
            activeTab === "suggested"
              ? "bg-[#2563EB] text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Suggested Investors</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("similar")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
            activeTab === "similar"
              ? "bg-[#2563EB] text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span>Invested in Similar Businesses</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-6">
        <div className="pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-[#172033]">
            {activeTab === "suggested" ? "Suggested Investors" : "Investors in Similar Businesses"}
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Browse all investor profiles. No sector or investment-history match is required.
          </p>
        </div>

        {status === "unauthenticated" ? (
          <div className="text-center py-16 text-gray-500">
            <Link href="/login" className="font-medium text-blue-700 hover:underline">Sign in</Link> to discover investors.
          </div>
        ) : loading || status === "loading" || (status === "authenticated" && !user?.id) ? (
          <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-5">
                  <div className="flex gap-4">
                    <Skeleton circle width={56} height={56} />
                    <div className="flex-1">
                      <Skeleton width="80%" height={20} />
                      <Skeleton width="40%" height={14} className="mt-2" />
                    </div>
                  </div>
                  <Skeleton count={2} className="mt-4" />
                </div>
              ))}
            </div>
          </SkeletonTheme>
        ) : error ? (
          <div className="py-12 text-center text-sm text-red-600" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => fetchInvestors(activeTab)}
              className="mt-3 font-semibold text-blue-700 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : investors.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No investor profiles are available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {investors.map((investor) => <InvestorCard key={investor.id} investor={investor} />)}
          </div>
        )}
      </div>
    </section>
  );
}

export default function CollaborateClient() {
  const accountType = useUserStore((state) => state.user?.accountType);
  return accountType === "INVESTOR" ? <InvestorCollaborationClient /> : <BusinessCollaborationClient />;
}
