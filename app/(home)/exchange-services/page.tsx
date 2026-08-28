"use client";

import { useEffect, useState, useCallback } from "react";
import ExchangeCard from "@/components/home/exchange/exchange-card";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "react-loading-skeleton/dist/skeleton.css";

export default function ExchangeServicesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMatches = useCallback(async (pageNum: number) => {
    setLoading(true);
    
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const res = await fetch(`/api/exchange?page=${pageNum}&limit=10`);
      const json = await res.json();
      
      if (json.success) {
        setCompanies(json.data);
        setTotalPages(json.pagination?.totalPages || 1);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Failed to load exchange services", error);
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchMatches(1);
  }, [fetchMatches]); 

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm mb-4">
        <h1 className="text-xl font-bold text-gray-900">Exchange Services</h1>
        <p className="text-sm text-gray-500 mt-1">Find the right partners based on your offerings and needs.</p>
      </div>
      
      {loading ? (
        <div className="grid gap-4">
          <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <div className="flex gap-4 items-center">
                  <Skeleton circle width={64} height={64} borderRadius={8} />
                  <div className="flex-1">
                    <Skeleton width="60%" height={20} />
                    <Skeleton width="30%" height={12} className="mt-2" />
                  </div>
                </div>
                <Skeleton className="mt-5" height={60} borderRadius={8} />
              </div>
            ))}
          </SkeletonTheme>
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-20 text-gray-500 bg-white rounded-lg border border-gray-200 shadow-sm">
           No matching partners found at the moment.
        </div>
      ) : (
        <div className="grid gap-0">
          {companies.map((c) => (
            <ExchangeCard key={c.id} company={c} />
          ))}

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
              <button 
                onClick={() => fetchMatches(page - 1)}
                disabled={page === 1 || loading}
                className="flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-gray-600 border border-transparent hover:border-gray-200"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              
              <div className="text-sm font-medium text-gray-500">
                Page <span className="text-gray-900 font-semibold">{page}</span> of {totalPages}
              </div>
              
              <button 
                onClick={() => fetchMatches(page + 1)}
                disabled={page >= totalPages || loading}
                className="flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-md transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-gray-600 border border-transparent hover:border-gray-200"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}