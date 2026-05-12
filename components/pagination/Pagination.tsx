"use client";

interface PaginationNavigationProps {
  page: number;
  totalPages: number;
  onNext: () => void;
  onPrevious: () => void;
}

export function PaginationNavigation({
  page,
  totalPages,
  onNext,
  onPrevious,
}: PaginationNavigationProps) {
  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;
  const isDisabled = totalPages <= 1;

  return (
    <div className="flex items-center justify-between self-end rounded-3xl bg-white p-5 shadow-sm border border-gray-100">
      {/* Page Info */}
      <p className="text-sm text-gray-500">
        Page{" "}
        <span className="font-semibold text-[#050a30]">
          {totalPages === 0 ? 0 : page}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-[#050a30]">
          {totalPages}
        </span>
      </p>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onPrevious}
          disabled={isFirstPage || isDisabled}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition
          hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        <button
          onClick={onNext}
          disabled={isLastPage || isDisabled}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition
          hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}