// app/admin/plans/page.tsx

"use client";

import { useState } from "react";

import useSWR from "swr";

import { Search, Wallet } from "lucide-react";

import { Input } from "@/components/ui/input";

import { fetcher } from "@/lib/fetcher";

import { usePagination } from "@/hooks/usePagination";

import ErrorLoading from "@/components/ErrorLoading";

import { PaginationNavigation } from "@/components/pagination/Pagination";

import { PlanCard, PlanCardSkeleton } from "./_components/PlanCard";
import PlanFormDialog from "./_components/FormDialog";
import { Button } from "@/components/ui/button";

export default function AdminPlansPage() {
  const [search, setSearch] = useState("");

  const { page, setPage, nextPage, prevPage } = usePagination();

  const query = `/api/plans?page=${page}&limit=10&search=${search}`;

  const { data, error, isLoading, mutate } = useSWR(query, fetcher);

  return (
    <main>
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Left */}
            <div>
              <div className="flex items-center gap-2">
                <Wallet className="h-6 w-6 text-[#4338ca]" />

                <h1 className="text-3xl font-bold text-[#050a30]">
                  Subscription Plans
                </h1>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage plans and subscriptions
              </p>
            </div>

            {/* Right */}
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-[340px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  placeholder="Search plans..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="h-11 rounded-xl pl-10"
                />
              </div>

              {/* Create Plan */}
              <PlanFormDialog mutatePlans={mutate}>
                <Button className="h-11 rounded-xl px-5">+ Create Plan</Button>
              </PlanFormDialog>
            </div>
          </div>
        </div>

        <ErrorLoading
          loading={isLoading}
          error={error}
          dataLength={data?.data?.length}
          emptyMessage="No plans found"
          loadingCard={PlanCardSkeleton}
          loadingCount={6}
          className="space-y-4"
        >
          <div className="space-y-4">
            {data?.data?.map((plan: any) => (
              <PlanCard key={plan.id} plan={plan} mutatePlans={mutate} />
            ))}
          </div>
        </ErrorLoading>

        {data?.pagination && (
          <PaginationNavigation
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onNext={nextPage}
            onPrevious={prevPage}
          />
        )}
      </div>
    </main>
  );
}
