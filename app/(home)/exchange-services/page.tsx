"use client";

import { useEffect, useState, useCallback } from "react";
import ExchangeCard from "@/components/home/exchange/exchange-card";
import { Loader2 } from "lucide-react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function ExchangeServicesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchMatches = useCallback(async (pageNum: number, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/exchange?page=${pageNum}&limit=10`);
      const json = await res.json();
      
      if (json.success) {
        if (append) {
          setCompanies(prev => [...prev, ...json.data]);
        } else {
          setCompanies(json.data);
        }
        setHasMore(pageNum < json.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to load exchange services", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []); 

  useEffect(() => {
    fetchMatches(1);
  }, [fetchMatches]); 

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Exchange Services</h1>
      
      {loading ? (
        <div className="grid gap-4">
          <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-[28px] bg-white p-6 shadow-sm border border-slate-50">
                <div className="flex gap-4 items-center">
                  <Skeleton circle width={80} height={80} />
                  <div className="flex-1">
                    <Skeleton width="60%" height={20} />
                    <Skeleton width="30%" height={12} className="mt-2" />
                  </div>
                </div>
                <Skeleton className="mt-5" height={60} borderRadius={16} />
              </div>
            ))}
          </SkeletonTheme>
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-20 text-slate-500 bg-white rounded-3xl border border-slate-100">
           No matching partners found at the moment.
        </div>
      ) : (
        <div className="grid gap-4">
          {companies.map((c) => (
            <ExchangeCard key={c.id} company={c} />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <button 
              onClick={() => {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchMatches(nextPage, true);
              }}
              disabled={loadingMore}
              className="w-full py-4 text-sm font-bold text-[#5667ff] hover:bg-[#EEF0FF] rounded-2xl transition flex items-center justify-center gap-2 border border-slate-100 bg-white"
            >
              {loadingMore ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                "Load More Partners"
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}