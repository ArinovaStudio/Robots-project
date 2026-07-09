"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import CompanyCard from "@/components/home/search/company-card";
import CompanySearch from "@/components/home/search/company-search";
import { collaborateCompanies } from "@/lib/collaborateData";
import "react-loading-skeleton/dist/skeleton.css";

export default function CollaboratePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [loading, setLoading] = useState(true);

  const companies = useMemo(() => {
    const query = queryParam.trim().toLowerCase();

    if (!query) {
      return collaborateCompanies;
    }

    return collaborateCompanies.filter((company) =>
      [
        company.companyName,
        company.type,
        company.description,
        String(company.yearOfEstablishment),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [queryParam]);

  useEffect(() => {
    setSearchQuery(queryParam);
    setLoading(true);

    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [queryParam]);

  useEffect(() => {
    const handler = window.setTimeout(() => {
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

    return () => window.clearTimeout(handler);
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
      <CompanySearch
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={handleSearch}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Collaboration Companies</h2>
        <span className="text-xl font-semibold text-slate-400">
          {companies.length}
        </span>
      </div>

      <div className="space-y-5">
        {loading ? (
          <SkeletonTheme baseColor="#f1f5f9" highlightColor="#ffffff">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-[28px] bg-white p-5 border border-slate-100 shadow-sm"
              >
                <div className="flex gap-4">
                  <Skeleton circle width={80} height={80} />
                  <div className="flex-1 mt-2">
                    <Skeleton width="40%" height={24} />
                    <Skeleton width="20%" height={14} className="mt-2" />
                  </div>
                </div>
                <div className="mt-6">
                  <Skeleton count={2} />
                </div>
                <div className="mt-6 grid grid-cols-5 gap-4">
                  <Skeleton count={5} height={40} />
                </div>
              </div>
            ))}
          </SkeletonTheme>
        ) : companies.length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-white rounded-[28px] border border-slate-100 shadow-sm">
            No collaboration companies found matching "{queryParam}".
          </div>
        ) : (
          companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))
        )}
      </div>
    </section>
  );
}
