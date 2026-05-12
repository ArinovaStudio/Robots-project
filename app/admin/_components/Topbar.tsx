"use client";

import React from "react";

import { Bell, ChevronDown, Menu, Search, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Props {
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Topbar({ setMobileOpen }: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setMobileOpen(true)}
          className="md:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <div className="group hidden h-11 w-[320px] items-center gap-3 rounded-2xl border bg-muted/40 px-4 transition-all focus-within:border-primary focus-within:bg-background focus-within:shadow-sm md:flex">
          <Search className="h-4 w-4 text-muted-foreground" />

          <input
            type="text"
            placeholder="Search dashboard..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />

          <kbd className="hidden rounded-md border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right */}
      <div className="ml-auto flex items-center gap-2">
        {/* Search Mobile */}
        <Button size="icon" variant="ghost" className="md:hidden">
          <Search className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <Button size="icon" variant="ghost" className="relative rounded-xl">
          <Bell className="h-5 w-5" />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
        </Button>

        {/* Settings */}
        <Button size="icon" variant="ghost" className="rounded-xl">
          <Settings className="h-5 w-5" />
        </Button>

        {/* Divider */}
        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-2xl p-1 pr-2 transition-colors hover:bg-muted">
              <Avatar className="h-9 w-9 border">
                <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                  JD
                </AvatarFallback>
              </Avatar>

              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-none">Jane Doe</p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Administrator
                </p>
              </div>

              <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 rounded-2xl">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">Jane Doe</p>

              <p className="text-xs text-muted-foreground">jane@example.com</p>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem>Profile</DropdownMenuItem>

            <DropdownMenuItem>Settings</DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="text-red-500 focus:text-red-500">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
