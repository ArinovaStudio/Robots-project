
"use client";

import Navbar from "@/components/home/navbar";
import LeftSidebar from "@/components/home/left-sidebar";
import { useSelectedLayoutSegment } from "next/navigation";
import { SessionSync } from "@/components/SessionSync";
import SocketAnnouncer from "@/components/SocketAnnouncer";
import { useUserStore } from "@/store/AuthStore";

export default function DashboardLayout({
  children,
  rightSidebar,
}: {
  children: React.ReactNode;
  rightSidebar: React.ReactNode;
}) {
  const segment = useSelectedLayoutSegment();
  const listItems = ["explore", "search"];
  const showRightSidebar = segment && listItems.includes(segment);
  const { user } = useUserStore();

  const isMessages = segment === "messages";

  return (
    <SessionSync>
      {user && <SocketAnnouncer userId={user.id} />}
      <div className="min-h-screen bg-[#F3F2EF]">
        <Navbar />

        <div className="mx-auto grid max-w-[1400px] grid-cols-12 gap-5 p-5">

          {/* Left */}
          {!isMessages && (
            <div className="col-span-3 hidden xl:block">
              <div className="sticky top-[84px] max-h-[calc(100vh-100px)] overflow-y-auto overscroll-contain sidebar-scroll pr-1">
                <LeftSidebar />
              </div>
            </div>
          )}

          <div
            className={`
              col-span-12
              ${isMessages ? "" : showRightSidebar ? "xl:col-span-6" : "xl:col-span-9"}
            `}
          >
            {children}
          </div>

          {/* Right */}
          {showRightSidebar && !isMessages && (
            <div className="hidden col-span-3 xl:block">
              <div className="sticky top-[84px] max-h-[calc(100vh-100px)] overflow-y-auto overscroll-contain sidebar-scroll pr-1">
                {rightSidebar}
              </div>
            </div>
          )}
        </div>
      </div>
    </SessionSync>
  );
}