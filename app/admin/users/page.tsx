"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { Filter, RotateCcw, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserCard, UserCardSkeleton } from "./_components/UserCard";
import { fetcher } from "@/lib/fetcher";
import { usePagination } from "@/hooks/usePagination";
import { PaginationNavigation } from "@/components/pagination/Pagination";
import ErrorLoading from "@/components/ErrorLoading";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [accountType, setAccountType] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [verificationFilter, setVerificationFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("oldest");
  const { page, setPage, nextPage, prevPage } = usePagination();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  const query = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
      sort: sortOrder,
    });
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (accountType !== "ALL") params.set("accountType", accountType);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (verificationFilter !== "ALL") params.set("verificationStatus", verificationFilter);
    if (roleFilter !== "ALL") params.set("role", roleFilter);
    return `/api/admin/users?${params.toString()}`;
  }, [page, sortOrder, debouncedSearch, accountType, statusFilter, verificationFilter, roleFilter]);

  const { data, error, isLoading, mutate } = useSWR(query, fetcher);

  const hasActiveFilters =
    search.trim().length > 0 ||
    accountType !== "ALL" ||
    statusFilter !== "ALL" ||
    verificationFilter !== "ALL" ||
    roleFilter !== "ALL" ||
    sortOrder !== "oldest";

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setAccountType("ALL");
    setStatusFilter("ALL");
    setVerificationFilter("ALL");
    setRoleFilter("ALL");
    setSortOrder("oldest");
    setPage(1);
  };

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
                placeholder="Search name, email, company, firm..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-11 rounded-xl pl-10"
              />
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 mr-1">
              <Filter className="h-3.5 w-3.5 text-[#4338ca]" />
              <span>Filters</span>
            </div>

            <select
              aria-label="Filter by account type"
              value={accountType}
              onChange={(e) => {
                setAccountType(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none focus:border-[#4338ca] focus:bg-white transition"
            >
              <option value="ALL">All Types</option>
              <option value="BUSINESS">Business</option>
              <option value="INVESTOR">Investor</option>
            </select>

            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none focus:border-[#4338ca] focus:bg-white transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>

            <select
              aria-label="Filter by verification status"
              value={verificationFilter}
              onChange={(e) => {
                setVerificationFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none focus:border-[#4338ca] focus:bg-white transition"
            >
              <option value="ALL">All Verifications</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING">Pending</option>
              <option value="UNVERIFIED">Unverified</option>
              <option value="MORE_INFO_REQUIRED">Info Required</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              aria-label="Filter by role"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none focus:border-[#4338ca] focus:bg-white transition"
            >
              <option value="ALL">All Roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>

            <select
              aria-label="Sort users"
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium text-slate-700 outline-none focus:border-[#4338ca] focus:bg-white transition"
            >
              <option value="oldest">Oldest first</option>
              <option value="newest">Newest first</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}

            {typeof data?.pagination?.total === "number" && (
              <span className="ml-auto text-xs font-medium text-slate-500">
                {data.pagination.total} {data.pagination.total === 1 ? "user" : "users"} found
              </span>
            )}
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