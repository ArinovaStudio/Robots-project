"use client";

import { useEffect, useState } from "react";
import CompanyCard from "@/components/home/search/company-card";
import ConnectionRequests from "@/components/home/connection-requests";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Users, Briefcase } from "lucide-react";

export default function CollaboratePage() {
  const [activeTab, setActiveTab] = useState<"suggested" | "similar">("suggested");
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async (type: "suggested" | "similar") => {
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
  };

  useEffect(() => {
    fetchMatches(activeTab);
  }, [activeTab]);

  return (
    <section className="mx-auto max-w-6xl space-y-6 pb-20">
      
      {/* Connection Requests */}
      <div className="-mt-4">
        <ConnectionRequests />
      </div>

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
          Suggested Partners
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
        {loading ? (
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
             No {activeTab === "suggested" ? "suggested partners" : "similar businesses"} found. Try updating your profile's needs and offerings.
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
