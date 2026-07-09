"use client";

import { ArrowRight } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function TopSearches({ searches, loading }: { searches: any[], loading: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleSearchClick = (query: string) => {
    router.push(`${pathname}?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="rounded-3xl bg-background p-5 border">
      <h3 className="text-lg font-semibold">Top Searches</h3>

      <div className="mt-4 space-y-4">
        {loading ? (
          <Skeleton count={6} height={24} className="mb-2 rounded-lg" />
        ) : (
          searches.map((item, i) => (
            <button
              key={i}
              onClick={() => handleSearchClick(item.title)}
              className="flex w-full items-center justify-between text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="capitalize">{item.title}</span>
              <ArrowRight className="size-4 text-blue-500" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}