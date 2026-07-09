"use client";

import { useRouter, usePathname } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function TopTags({ tags, loading }: { tags: any[], loading: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleTagClick = (tag: string) => {
    router.push(`${pathname}?search=${encodeURIComponent(tag)}`);
  };

  return (
    <div className="rounded-3xl border bg-background p-5">
      <h3 className="text-lg font-semibold">Top Tags</h3>

      <div className="mt-4 flex flex-wrap gap-2.5">
        {loading ? (
          <Skeleton width={80} height={32} borderRadius={999} count={8} inline className="mr-2 mb-2" />
        ) : (
          tags.map((item, i) => (
            <button
              key={i}
              onClick={() => handleTagClick(item.tag)}
              className="rounded-full border bg-background px-3 py-1.5 text-xs font-bold text-muted-foreground shadow-sm transition-colors hover:text-foreground"
            >
              {item.tag}
            </button>
          ))
        )}
      </div>
    </div>
  );
}