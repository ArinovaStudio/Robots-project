"use client";

import { useEffect, useState } from "react";
import CompanyCard from "@/components/home/search/company-card";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Store, ShoppingBag, Target, Sparkles, ArrowRight, ShieldAlert, Layers, FileText, UserCheck } from "lucide-react";
import { useUserStore } from "@/store/AuthStore";
import Link from "next/link";
import CollaborateModal from "@/components/modals/collaborate-modal";

export default function MarketplaceClient() {
  const { user } = useUserStore();
  const isInvestor = user?.accountType === "INVESTOR";
  const [activeTab, setActiveTab] = useState<"suppliers" | "buyers">("suppliers");
  const [secondaryTab, setSecondaryTab] = useState<"overall" | "posts" | "profile">("overall");
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [collaborateTarget, setCollaborateTarget] = useState<{ id: string; name: string } | null>(null);

  const fetchMatches = async () => {
    if (isInvestor) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const endpoint = `${
        activeTab === "suppliers" ? "/api/match/suppliers" : "/api/match/buyers"
      }?source=${secondaryTab}`;
      const res = await fetch(endpoint);
      const json = await res.json();
      
      if (json.success) {
        if (activeTab === "suppliers") setSuppliers(json.data);
        else setBuyers(json.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [activeTab, secondaryTab, isInvestor]);

  if (isInvestor) {
    return (
      <section className="mx-auto max-w-4xl space-y-6 pb-20 pt-4">
        <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8F4E8] p-8 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-[#EFF6FF] border border-blue-200 p-3 text-[#2563EB] shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <span className="rounded-full bg-[#EFF6FF] border border-blue-200 px-3 py-0.5 text-xs font-bold text-[#2563EB] uppercase tracking-wider">
                Investor Account Notice
              </span>
              <h1 className="mt-2 text-2xl font-bold text-[#172033]">
                Service Exchange Unavailable for Investors
              </h1>
              <p className="mt-2 text-sm text-[#64748B] leading-relaxed">
                As an investor on Connecto, you cannot exchange services. B2B service swapping and vendor matching are reserved strictly for registered business accounts.
              </p>
              <p className="mt-2 text-sm text-[#64748B] leading-relaxed">
                Instead, you have full access to our dedicated <strong className="text-[#172033]">Investor Portal</strong>, where you can explore curated startup ideas, live products, active pitch decks, and connect with companies doing good in your selected preferences.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/investors/portal"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 transition"
                >
                  <Sparkles className="w-4 h-4" /> Open Investor Portal <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/investors/portal?tab=performers"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#172033] hover:bg-gray-50 transition"
                >
                  View Companies Matching Your Preferences
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6 pb-20">
      
      {/* Sticky header: sits under the navbar (h-16); the wrapper repaints the page background so content never shows in the gap above the card */}
      <div className="sticky top-16 z-20 -mt-5 bg-[#F3F2EF] pt-5">
        <div className="bg-[#1E3A5F] rounded-2xl p-8 text-white shadow-xs border border-[#1E3A5F] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Target className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">B2B Collaboration</h1>
            <p className="text-blue-100 max-w-2xl">
              We use AI vector matching to pair what you offer with companies who need it, and match what you need with companies who supply it.
            </p>
          </div>
        </div>
      </div>

      {/* Primary Section Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1.5 shadow-xs flex items-center gap-1">
        <button
          onClick={() => setActiveTab("suppliers")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
            activeTab === "suppliers" 
              ? "bg-[#2563EB] text-white shadow-xs" 
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Store className="w-5 h-5" />
          <span>Suppliers for what you need</span>
        </button>
        <button
          onClick={() => setActiveTab("buyers")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
            activeTab === "buyers" 
              ? "bg-[#2563EB] text-white shadow-xs" 
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Buyers for what you offer</span>
        </button>
      </div>

      {/* Main Results Container */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-6">
        {/* Header & Secondary Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-[#172033]">
              {activeTab === "suppliers" ? "Recommended Suppliers" : "Potential Buyers"}
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {activeTab === "suppliers"
                ? "Discover businesses that can fulfill your commercial requirements and operational needs."
                : "Discover businesses actively in market for the products and services you provide."}
            </p>
          </div>

          {/* Secondary Navigation: Overall, Posts, Profile */}
          <div className="inline-flex items-center gap-1 bg-[#EFF6FF] border border-blue-100 p-1 rounded-xl self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setSecondaryTab("overall")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                secondaryTab === "overall"
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "text-blue-900 hover:bg-blue-100/60"
              }`}
            >
              <Layers size={13} />
              <span>Overall</span>
            </button>
            <button
              type="button"
              onClick={() => setSecondaryTab("posts")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                secondaryTab === "posts"
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "text-blue-900 hover:bg-blue-100/60"
              }`}
            >
              <FileText size={13} />
              <span>Posts</span>
            </button>
            <button
              type="button"
              onClick={() => setSecondaryTab("profile")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                secondaryTab === "profile"
                  ? "bg-[#2563EB] text-white shadow-xs"
                  : "text-blue-900 hover:bg-blue-100/60"
              }`}
            >
              <UserCheck size={13} />
              <span>Profile</span>
            </button>
          </div>
        </div>
        
        {loading ? (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(activeTab === "suppliers" ? suppliers : buyers).map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                showCollaborate={true}
                onCollaborate={(c) => setCollaborateTarget({ id: c.userId, name: c.companyName })}
              />
            ))}
          </div>
        )}
        
        {!loading && (activeTab === "suppliers" ? suppliers : buyers).length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Target className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-700">
              {secondaryTab === "posts"
                ? "No post-based commercial intent matches found yet."
                : secondaryTab === "profile"
                ? "No profile matches found for your current services or requirements."
                : "No collaboration recommendations found yet."}
            </p>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              {secondaryTab === "posts"
                ? "Publish a post explicitly describing what your business is looking for or offering to generate AI intent matches!"
                : "Try adding more keywords, services offered, and requirements to your company profile!"}
            </p>
          </div>
        )}
      </div>

      {/* Collaborate Modal */}
      {collaborateTarget && (
        <CollaborateModal
          recipientId={collaborateTarget.id}
          companyName={collaborateTarget.name}
          onClose={() => setCollaborateTarget(null)}
          onSuccess={() => setCollaborateTarget(null)}
        />
      )}
    </section>
  );
}
