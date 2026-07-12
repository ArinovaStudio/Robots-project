"use client";

import { useEffect, useState, useCallback } from "react";
import ExchangeCard from "@/components/home/exchange/exchange-card";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "react-loading-skeleton/dist/skeleton.css";

export default function FindBusinessesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 3;

  const fetchMatches = useCallback(async (pageNum: number) => {
    setLoading(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const res = await fetch("/api/match/similar");
      const json = await res.json();
      console.log(json);

      if (json.success) {
        const allCompanies = json.data || [];
        const start = (pageNum - 1) * itemsPerPage;
        const end = start + itemsPerPage;

        setCompanies(allCompanies.slice(start, end));
        setTotalPages(
          Math.max(1, Math.ceil(allCompanies.length / itemsPerPage)),
        );
        setPage(pageNum);
      } else {
        setCompanies([]);
        setTotalPages(1);
      }
    } catch {
      setCompanies([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches(1);
  }, [fetchMatches]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Find Businesses</h1>

      {loading ? (
        <div className="grid gap-4">
          <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-[28px] bg-white p-6 shadow-sm border border-slate-50"
              >
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
        <div className="text-center py-20 text-slate-500 bg-white rounded-3xl border border-slate-100 shadow-sm">
          No businesses found in this category.
        </div>
      ) : (
        <div className="grid gap-4">
          {companies.map((company) => (
            
            <ExchangeCard
              key={company.userId || company.id}
              company={company}
            />
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm">
              <button
                onClick={() => fetchMatches(page - 1)}
                disabled={page === 1 || loading}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700"
              >
                <ChevronLeft size={18} />
                Previous
              </button>

              <div className="text-sm font-semibold text-slate-500">
                Page <span className="text-slate-900">{page}</span> of{" "}
                {totalPages}
              </div>

              <button
                onClick={() => fetchMatches(page + 1)}
                disabled={page >= totalPages || loading}
                className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700"
              >
                Next
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
