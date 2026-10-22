"use client";

import { useEffect, useState } from "react";
import CompanyCard from "@/components/home/search/company-card";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Store, ShoppingBag, Target, Sparkles, ArrowRight, ShieldAlert } from "lucide-react";
import { useUserStore } from "@/store/AuthStore";
import Link from "next/link";

export default function MarketplaceClient() {
  const { user } = useUserStore();
  const isInvestor = user?.accountType === "INVESTOR";
  const [activeTab, setActiveTab] = useState<"suppliers" | "buyers">("suppliers");
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    if (isInvestor) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const endpoint = activeTab === "suppliers" ? "/api/match/suppliers" : "/api/match/buyers";
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
  }, [activeTab, isInvestor]);

  if (isInvestor) {
    return (
      <section className="mx-auto max-w-4xl space-y-6 pb-20 pt-4">
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-700 shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
                Investor Account Notice
              </span>
              <h1 className="mt-2 text-2xl font-bold text-gray-900">
                Service Exchange Unavailable for Investors
              </h1>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                As an investor on Connecto, you cannot exchange services. B2B service swapping and vendor matching are reserved strictly for registered business accounts.
              </p>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Instead, you have full access to our dedicated <strong className="text-gray-900">Investor Portal</strong>, where you can explore curated startup ideas, live products, active pitch decks, and connect with companies doing good in your selected preferences.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/investors/portal"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition"
                >
                  <Sparkles className="w-4 h-4" /> Open Investor Portal <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/investors/portal?tab=performers"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
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
      
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Target className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">B2B Service Marketplace</h1>
          <p className="text-blue-100 max-w-2xl">
            We use AI vector matching to pair what you offer with companies who need it, and match what you need with companies who supply it.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-1 shadow-sm flex items-center">
        <button
          onClick={() => setActiveTab("suppliers")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-all ${
            activeTab === "suppliers" 
              ? "bg-blue-50 text-blue-700 shadow-sm" 
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Store className="w-5 h-5" />
          Suppliers for what you need
        </button>
        <button
          onClick={() => setActiveTab("buyers")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-sm font-medium transition-all ${
            activeTab === "buyers" 
              ? "bg-blue-50 text-blue-700 shadow-sm" 
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          Buyers for what you offer
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {activeTab === "suppliers" ? "Recommended Suppliers" : "Potential Buyers"}
        </h2>
        
        {loading ? (
          <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3].map((i) => (
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
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
        
        {!loading && (activeTab === "suppliers" ? suppliers : buyers).length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <Target className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No matches found yet. Try adding more keywords to your profile!</p>
          </div>
        )}
      </div>
    </section>
  );
}
