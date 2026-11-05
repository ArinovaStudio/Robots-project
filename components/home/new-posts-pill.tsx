"use client";

import { ArrowUp } from "lucide-react";

export default function NewPostsPill({ count, onClick }: { count: number; onClick: () => void }) {
  if (count <= 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center px-4">
      <button
        onClick={onClick}
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 animate-in slide-in-from-top-4 fade-in duration-300"
      >
        <ArrowUp size={16} />
        {count > 99 ? "99+" : count} new {count === 1 ? "post" : "posts"}
      </button>
    </div>
  );
}