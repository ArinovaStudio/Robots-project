"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Topbar from "./_components/Topbar";
import Sidebar from "./_components/Sidebar";

interface Props extends React.PropsWithChildren {}

export default function AdminLayout({ children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname?.() ?? "/admin";

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        setCollapsed={setCollapsed}
        setMobileOpen={setMobileOpen}
        pathname={pathname}
      />
      {/* ── RIGHT COLUMN ── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* ── TOPBAR ── */}
        <Topbar setMobileOpen={setMobileOpen} />

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 overflow-y-auto bg-background p-5">
          <div className="mx-auto bg-[#f6f8fb] rounded-2xl min-h-full w-full p-3">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
