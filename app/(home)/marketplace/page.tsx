"use client";

import { useEffect, useState } from "react";
import CompanyCard from "@/components/home/search/company-card";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Store, ShoppingBag, Target } from "lucide-react";

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<"suppliers" | "buyers">("suppliers");
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
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
  }, [activeTab]);

  return (
    <section className="mx-auto max-w-6xl space-y-6 pb-20">
      
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Target className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Marketplace Matching Engine</h1>
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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