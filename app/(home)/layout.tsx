"use client";

import Navbar from "@/components/home/navbar";
import LeftSidebar from "@/components/home/left-sidebar";
import { useSelectedLayoutSegment } from "next/navigation";

export default function DashboardLayout({
  children,
  rightSidebar,
}: {
  children: React.ReactNode;
  rightSidebar: React.ReactNode;
}) {
  const segment = useSelectedLayoutSegment();

  const showRightSidebar = segment === "explore" || segment === "search";

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="mx-auto grid max-w-[1400px] grid-cols-12 gap-5 p-5">
        {/* Left */}
        <div className="col-span-3 hidden xl:block">
          <div className="sticky top-24">
            <LeftSidebar />
          </div>
        </div>

        {/* Center */}
        <div
          className={`
            col-span-12
            ${showRightSidebar ? "xl:col-span-6" : "xl:col-span-9"}
          `}
        >
          {children}
        </div>

        {/* Right */}
        {showRightSidebar && (
          <div className="hidden col-span-3 xl:block scroll-mt-24">
            <div className="sticky top-0">{rightSidebar}</div>
          </div>
        )}
      </div>
    </div>
  );
}
