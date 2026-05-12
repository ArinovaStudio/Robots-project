"use client";

import { useState } from "react";
import useSWR from "swr";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import ErrorLoading from "@/components/ErrorLoading";
import { fetcher } from "@/lib/fetcher";
import { usePagination } from "@/hooks/usePagination";

import { PostCard, PostCardSkeleton } from "./_components/PostCard";
import { PaginationNavigation } from "@/components/pagination/Pagination";

export default function AdminReportsPage() {
  const [search] = useState(""); // optional later
  const { page, nextPage, prevPage, setPage } = usePagination();

  const query = `/api/admin/reports?page=${page}&limit=10&search=${search}`;

  const { data, error, isLoading, mutate } = useSWR(query, fetcher);

  const posts = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <main className="w-full h-full grid space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#050a30]">
              Reported Posts
            </h1>

            <p className="text-sm text-muted-foreground mt-1">
              Moderate posts flagged by users
            </p>
          </div>

          <div className="relative w-full md:w-[340px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              placeholder="Search reports..."
              className="h-11 rounded-xl pl-10"
              onChange={(e) => {
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <ErrorLoading
        loading={isLoading}
        error={error}
        dataLength={posts.length}
        emptyMessage="No reported posts found"
        loadingCard={PostCardSkeleton}
        loadingCount={5}
        className="space-y-4"
      >
        <div className="space-y-4">
          {posts.map((post: any) => (
            <PostCard key={post.postId} post={post} mutate={mutate} />
          ))}
        </div>
      </ErrorLoading>

      {/* Pagination */}
      {pagination && (
        <PaginationNavigation
          page={pagination.page}
          totalPages={pagination.totalPages}
          onNext={nextPage}
          onPrevious={prevPage}
        />
      )}
    </main>
  );
}