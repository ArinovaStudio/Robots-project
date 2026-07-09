// hooks/use-pagination.ts

"use client";

import { useState } from "react";

interface UsePaginationProps {
  initialPage?: number;
}

export function usePagination({
  initialPage = 1,
}: UsePaginationProps = {}) {
  const [page, setPage] = useState(initialPage);

  const nextPage = () => {
    setPage((prev) => prev + 1);
  };

  const prevPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const goToPage = (value: number) => {
    setPage(value);
  };

  return {
    page,
    setPage,
    nextPage,
    prevPage,
    goToPage,
  };
}