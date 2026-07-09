"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserCard, UserCardSkeleton } from "./_components/UserCard";
import { fetcher } from "@/lib/fetcher";
import { usePagination } from "@/hooks/usePagination";
import { PaginationNavigation } from "@/components/pagination/Pagination";
import ErrorLoading from "@/components/ErrorLoading";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const { page, setPage, nextPage, prevPage } = usePagination();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  const query = `/api/admin/users?page=${page}&limit=10&search=${debouncedSearch}`;
  const { data, error, isLoading, mutate } = useSWR(query, fetcher);

  return (
    <main className="w-full">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-[#4338ca]" />

                <h1 className="text-3xl font-bold text-[#050a30]">
                  Manage Users
                </h1>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                View and manage platform users
              </p>
            </div>

            <div className="relative w-full md:w-[340px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1); 
                }}
                className="h-11 rounded-xl pl-10"
              />
            </div>
          </div>
        </div>

        <ErrorLoading
          loading={isLoading}
          error={error}
          dataLength={data?.data?.length}
          emptyMessage="No users found"
          loadingCard={UserCardSkeleton}
          loadingCount={6}
          className="space-y-4"
        >
          <div className="space-y-4">
            {data?.data?.map((user: any) => (
              <UserCard key={user.id} user={user} mutateUsers={mutate} />
            ))}
          </div>
        </ErrorLoading>

        {/* Pagination */}
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