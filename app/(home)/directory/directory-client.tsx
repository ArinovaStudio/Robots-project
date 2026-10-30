"use client";

import CompanyCard from "@/components/home/search/company-card";
import CompanySearch from "@/components/home/search/company-search";
import { ScrollReveal, ScrollRevealItem } from "@/components/ui/ScrollReveal";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import React from "react";

type CompanyLike = {
  id: string | number;
  [key: string]: unknown;
};

function TopRatedCompaniesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const queryParam = searchParams.get("search") || "";
  
  const [companies, setCompanies] = useState<CompanyLike[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(() => queryParam);

  const fetchCompanies = async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?search=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success) {
        setCompanies(json.data);
        setTotal(json.pagination?.total || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCompanies(queryParam);
  }, [queryParam]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery !== queryParam) {
        const params = new URLSearchParams(searchParams);
        if (searchQuery) {
          params.set("search", searchQuery);
        } else {
          params.delete("search");
        }
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, queryParam, pathname, router, searchParams]);

  const handleSearch = () => {
    if (searchQuery !== queryParam) {
      const params = new URLSearchParams(searchParams);
      if (searchQuery) {
        params.set("search", searchQuery);
      } else {
        params.delete("search");
      }
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <section className="mx-auto max-w-6xl space-y-6 pb-20">
      <div className="pt-2">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-4">
          <h1 className="text-xl font-semibold text-gray-900">B2B Business Directory</h1>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">{total} results</span>
        </div>
      </div>

      <ScrollReveal direction="up" delay={0.05}>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <CompanySearch 
            value={searchQuery} 
            onChange={setSearchQuery} 
            onSearch={handleSearch} 
          />
        </div>
      </ScrollReveal>

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
             No companies found matching &quot;{queryParam}&quot;.
           </div>
        ) : (
          <ScrollReveal stagger direction="up">
            <div className="grid gap-0">
              {companies.map((company) => (
                <ScrollRevealItem key={company.id}>
                  <CompanyCard company={company} />
                </ScrollRevealItem>
              ))}
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}

export default function DirectoryClient() {
  return (
    <React.Suspense fallback={<div>Loading directory...</div>}>
      <TopRatedCompaniesContent />
    </React.Suspense>
  );
}

