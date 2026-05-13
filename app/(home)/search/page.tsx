"use client";

import CompanyCard from "@/components/home/search/company-card";
import CompanySearch from "@/components/home/search/company-search";
import { useEffect, useState } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function TopRatedCompanies() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCompanies = async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?search=${query}`);
      const json = await res.json();
      if (json.success) {
        setCompanies(json.data);
        setTotal(json.pagination.total);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return (
    <section className="mx-auto max-w-6xl space-y-6 pb-20">
      <CompanySearch 
        value={searchQuery} 
        onChange={setSearchQuery} 
        onSearch={() => fetchCompanies(searchQuery)} 
      />

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Top Rated Companies</h2>
        <span className="text-xl font-semibold text-slate-400">{total}</span>
      </div>

      <div className="space-y-5">
        {loading ? (
          <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-[28px] bg-white p-5 border border-slate-100 shadow-sm">
                <div className="flex gap-4">
                  <Skeleton circle width={80} height={80} />
                  <div className="flex-1 mt-2">
                    <Skeleton width="40%" height={24} />
                    <Skeleton width="20%" height={14} className="mt-2" />
                  </div>
                </div>
                <div className="mt-6"><Skeleton count={2} /></div>
                <div className="mt-6 grid grid-cols-5 gap-4"><Skeleton count={5} height={40} /></div>
              </div>
            ))}
          </SkeletonTheme>
        ) : (
          companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))
        )}
      </div>
    </section>
  );
}