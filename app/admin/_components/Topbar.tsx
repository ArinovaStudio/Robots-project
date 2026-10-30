"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Bell, ChevronDown, Menu, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStore } from "@/store/AuthStore";
import { useLogout } from "@/helpers/auth-helpers";
import { navItems } from "@/config";
import { fetcher } from "@/lib/fetcher";

interface Props {
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface AdminAlertResponse {
  success: boolean;
  data: {
    pendingVerifications: number;
    pendingReports: number;
  };
}

export default function Topbar({ setMobileOpen }: Props) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { handleLogout } = useLogout();
  const [search, setSearch] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const { data: alerts, error: alertsError } = useSWR<AdminAlertResponse>("/api/admin/notifications", fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  });

  const name = user?.name || "Administrator";
  const email = user?.email || "";
  const image = user?.image || "";
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const destinations = navItems.flatMap((group) => group.items);
  const matches = search.trim()
    ? destinations.filter((item) => item.label.toLowerCase().includes(search.trim().toLowerCase()))
    : [];
  const pendingVerifications = alerts?.data?.pendingVerifications ?? 0;
  const pendingReports = alerts?.data?.pendingReports ?? 0;
  const pendingAlerts = pendingVerifications + pendingReports;

  const openFirstSearchResult = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && matches[0]) {
      event.preventDefault();
      router.push(matches[0].href);
      setSearch("");
      setMobileSearchOpen(false);
    }
    if (event.key === "Escape") {
      setSearch("");
      setMobileSearchOpen(false);
    }
  };

  const renderSearch = (className: string) => (
    <div className={`relative ${className}`}>
      <div className="flex h-11 items-center gap-3 rounded-2xl border bg-muted/40 px-4 transition-all focus-within:border-primary focus-within:bg-background focus-within:shadow-sm">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={openFirstSearchResult}
          placeholder="Search admin pages..."
          aria-label="Search admin pages"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="hidden rounded-md border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
          Enter
        </kbd>
      </div>
      {search.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-white p-1 shadow-lg">
          {matches.length ? matches.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                setSearch("");
                setMobileSearchOpen(false);
              }}
              className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {item.label}
            </Link>
          )) : (
            <p className="px-3 py-2 text-sm text-gray-500">No admin pages found.</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <header className="relative sticky top-0 z-30 flex h-16 shrink-0 items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setMobileOpen(true)}
          className="md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
        {renderSearch("hidden w-[320px] md:block")}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="md:hidden"
          onClick={() => setMobileSearchOpen((open) => !open)}
          aria-label="Search admin pages"
          aria-expanded={mobileSearchOpen}
        >
          <Search className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="relative rounded-xl" aria-label={`Admin alerts: ${pendingAlerts} pending`}>
              <Bell className="h-5 w-5" />
              {pendingAlerts > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
                  {pendingAlerts > 99 ? "99+" : pendingAlerts}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-2xl">
            <p className="px-2 py-1.5 text-sm font-semibold">Admin alerts</p>
            <DropdownMenuSeparator />
            {alertsError && (
              <p role="alert" className="px-2 py-2 text-xs text-red-600">
                Could not load admin alerts. Refresh the page to retry.
              </p>
            )}
            <DropdownMenuItem asChild>
              <Link href="/admin/verifications" className="flex w-full justify-between">
                Pending verifications <span className="font-semibold">{alerts ? pendingVerifications : "—"}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/reports" className="flex w-full justify-between">
                Pending reports <span className="font-semibold">{alerts ? pendingReports : "—"}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/notifications" className="flex w-full justify-center text-xs font-semibold text-blue-600 hover:text-blue-700">
                View All Notifications →
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button asChild size="icon" variant="ghost" className="rounded-xl" aria-label="Settings">
          <Link href="/settings"><Settings className="h-5 w-5" /></Link>
        </Button>

        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-2xl p-1 pr-2 transition-colors hover:bg-muted">
              <Avatar className="h-9 w-9 border">
                {image ? <AvatarImage src={image} alt={name} /> : null}
                <AvatarFallback className="bg-[#1E3A5F] text-sm font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-none">{name}</p>
                <p className="mt-1 text-xs text-muted-foreground">Administrator</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 rounded-2xl">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/profile">Profile</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/settings">Settings</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500 focus:text-red-500" onSelect={() => void handleLogout()}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {mobileSearchOpen && renderSearch("absolute left-3 right-3 top-16 z-50 md:hidden")}
    </header>
  );
}
