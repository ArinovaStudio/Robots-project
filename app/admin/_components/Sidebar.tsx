"use client";

import Link from "next/link";
import React from "react";

import {
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

import { navItems } from "@/config";

import { cn } from "@/lib/utils";
import { useLogout } from "@/helpers/auth-helpers";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  collapsed: boolean;
  mobileOpen: boolean;

  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;

  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;

  pathname: string;
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  setCollapsed,
  setMobileOpen,
  pathname,
}: Props) {
  const { handleLogout } = useLogout();
  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-all duration-300",
          "shadow-xl md:shadow-none",
          "md:relative md:translate-x-0",
          collapsed ? "md:w-[74px]" : "md:w-[260px]",
          mobileOpen
            ? "w-[260px] translate-x-0"
            : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "relative flex h-16 shrink-0 items-center border-b px-4",
            collapsed ? "justify-center" : "justify-between"
          )}
        >
          {/* Logo */}
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 overflow-hidden",
              collapsed && "justify-center"
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-md">
              A
            </div>

            {!collapsed && (
              <div className="flex flex-col leading-none">
                <span className="text-sm font-semibold tracking-tight">
                  Admin Panel
                </span>

                <span className="text-xs text-muted-foreground">
                  Platform Control
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Toggle */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setCollapsed((prev) => !prev)}
            className={cn(
              "hidden md:flex",
              collapsed &&
                "absolute -right-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border bg-background shadow-md"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>

          {/* Mobile Close */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setMobileOpen(false)}
            className="md:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-6">
            {navItems.map((group) => (
              <div key={group.title} className="space-y-2">
                {!collapsed && (
                  <div className="px-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {group.title}
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  {group.items.map(({ label, href, icon: Icon }) => {
                    const active = pathname === href;

                    return (
                      <Link
                        key={label}
                        href={href}
                        title={collapsed ? label : undefined}
                        className={cn(
                          "group relative flex items-center rounded-xl text-sm transition-all duration-200",
                          collapsed
                            ? "justify-center px-2 py-3"
                            : "gap-3 px-3 py-2.5",
                          active
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {/* Active Indicator */}
                        {active && (
                          <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary-foreground/80" />
                        )}

                        <Icon
                          size={18}
                          className={cn(
                            "shrink-0 transition-transform duration-200",
                            !active && "group-hover:scale-110"
                          )}
                        />

                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate font-medium">
                              {label}
                            </span>

                            {active && (
                              <ChevronRight className="h-4 w-4 opacity-80" />
                            )}
                          </>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        {/* Footer */}
        <div className="p-3">
          <Button
            variant="ghost"
            className={cn(
              "h-11 w-full rounded-xl text-muted-foreground hover:text-red-500",
              collapsed ? "justify-center px-0" : "justify-start gap-3 px-3"
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />

            {!collapsed && <span className="font-medium">Log out</span>}
          </Button>
        </div>
      </aside>
    </>
  );
}
