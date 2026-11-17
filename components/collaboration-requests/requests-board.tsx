"use client";

import type { ReactNode } from "react";
import { ChevronDown, Search, X } from "lucide-react";
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
  direction?: "received" | "sent";
  onDirectionChange?: (dir: "received" | "sent") => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  searchPlaceholder?: string;
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
  direction = "received",
  onDirectionChange,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
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
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
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

          <div className="flex flex-wrap items-center gap-2 self-end lg:self-auto shrink-0">
            {/* Search input */}
            {onSearchChange && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder || "Search requests..."}
                  value={searchQuery || ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-44 sm:w-52 pl-8 pr-7 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Adjacent Left: Sort dropdown */}
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

            {/* Most Right: Direction filter dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer shadow-2xs"
                >
                  <span>{direction === "sent" ? "Request sent" : "Request received"}</span>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-white border border-gray-200 p-1 rounded-xl shadow-lg">
                <DropdownMenuItem
                  onSelect={() => onDirectionChange?.("received")}
                  className={`px-3 py-1.5 text-xs font-medium cursor-pointer rounded-lg ${
                    direction !== "sent" ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"
                  }`}
                >
                  Request received
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => onDirectionChange?.("sent")}
                  className={`px-3 py-1.5 text-xs font-medium cursor-pointer rounded-lg ${
                    direction === "sent" ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"
                  }`}
                >
                  Request sent
                </DropdownMenuItem>
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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <Search size={22} strokeWidth={2} />
          </div>
          <h3 className="text-base font-bold text-gray-800">{emptyTitle}</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">{emptyDescription}</p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange?.("")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer shadow-2xs mt-2"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">{children}</div>
      )}
    </div>
  );
}
