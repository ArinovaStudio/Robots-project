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
  return (
    <div className="flex items-center justify-between rounded-3xl bg-white p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>

      <div className="flex items-center gap-3">
        <button
          disabled={page === 1}
          onClick={onPrevious}
          className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
        >
          Previous
        </button>

        <button
          disabled={page === totalPages}
          onClick={onNext}
          className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}