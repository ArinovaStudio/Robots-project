"use client";

import type { ReactNode } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface BoardStat {
  label: string;
  value: number;
  caption: string;
  icon: ReactNode;
  tone: "emerald" | "amber";
}

export interface BoardFilter {
  key: string;
  label: string;
  count?: number;
}

export interface BoardSortOption {
  key: string;
  label: string;
}

interface RequestsBoardProps {
  stats: BoardStat[];
  filters: BoardFilter[];
  activeFilter: string;
  onFilterChange: (key: string) => void;
  sortOptions: BoardSortOption[];
  sortBy: string;
  onSortChange: (key: string) => void;
  loading: boolean;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  children: ReactNode;
}

const TONES = {
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
} as const;
export default function RequestsBoard({
  stats,
  filters,
  activeFilter,
  onFilterChange,
  sortOptions,
  sortBy,
  onSortChange,
  loading,
  isEmpty,
  emptyTitle,
  emptyDescription,
  children,
}: RequestsBoardProps) {
  const sortLabel = sortOptions.find((o) => o.key === sortBy)?.label ?? sortOptions[0]?.label;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 flex items-start justify-between shadow-xs"
          >
            <div>
              <span className="text-xs font-semibold text-gray-500">{stat.label}</span>
              <p className="mt-1 text-3xl font-extrabold text-gray-900 tracking-tight">{stat.value}</p>
              <span className="text-xs text-gray-400 mt-1 block">{stat.caption}</span>
            </div>
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${TONES[stat.tone]}`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {filters.map((f) => {
              const active = activeFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => onFilterChange(f.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                    active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                  }`}
                >
                  {f.label}
                  {f.count !== undefined && (
                    <span
                      className={`rounded-full px-1.5 text-[10px] font-bold ${
                        active ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {f.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer shadow-2xs"
                >
                  <span>{sortLabel}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 p-1 rounded-xl shadow-lg">
                {sortOptions.map((o) => (
                  <DropdownMenuItem
                    key={o.key}
                    onSelect={() => onSortChange(o.key)}
                    className={`px-3 py-1.5 text-xs font-medium cursor-pointer rounded-lg ${
                      sortBy === o.key ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"
                    }`}
                  >
                    {o.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl border border-gray-200 bg-white p-6 animate-pulse" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500 space-y-3">
          <Sparkles className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="text-base font-bold text-gray-800">{emptyTitle}</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">{emptyDescription}</p>
        </div>
      ) : (
        <div className="space-y-4">{children}</div>
      )}
    </div>
  );
}
