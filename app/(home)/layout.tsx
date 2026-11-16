"use client";

import Navbar from "@/components/home/navbar";
import LeftSidebar from "@/components/home/left-sidebar";
import { useSelectedLayoutSegment, useSelectedLayoutSegments } from "next/navigation";
import { SessionSync } from "@/components/SessionSync";
import SocketAnnouncer from "@/components/SocketAnnouncer";
import { useUserStore } from "@/store/AuthStore";
const PROFILE_STATIC_ROUTES = ["saved-posts", "connections", "followers"];

export default function DashboardLayout({
  children,
  rightSidebar,
}: {
  children: React.ReactNode;
  rightSidebar: React.ReactNode;
}) {
  const segment = useSelectedLayoutSegment();
  const segments = useSelectedLayoutSegments();
  const { user } = useUserStore();

  const isMessages = segment === "messages";
  const isViewedProfile =
    segments[0] === "profile" &&
    !PROFILE_STATIC_ROUTES.includes(segments[1] ?? "");

  const listItems = ["explore", "search"];
  const showRightSidebar =
    (!!segment && listItems.includes(segment)) || isViewedProfile;

  const showLeftSidebar = !isMessages && !isViewedProfile;

  return (
    <SessionSync>
      {user && <SocketAnnouncer userId={user.id} />}
      <div className="min-h-screen bg-[#F3F2EF]">
        <Navbar />

        <div
          className={`mx-auto grid grid-cols-12 gap-5 p-5 ${
            isViewedProfile ? "max-w-[1128px]" : "max-w-[1400px]"
          }`}
        >
          {/* Left */}
          {showLeftSidebar && (
            <div className="col-span-3 hidden xl:block">
              <div className="sticky top-[84px] max-h-[calc(100vh-100px)] overflow-y-auto overscroll-contain sidebar-scroll pr-1">
                <LeftSidebar />
              </div>
            </div>
          )}

          <div
            className={`
              col-span-12
              ${
                isMessages
                  ? ""
                  : isViewedProfile
                  ? "xl:col-span-8"
                  : showRightSidebar
                  ? "xl:col-span-6"
                  : "xl:col-span-9"
              }
            `}
          >
            {children}
          </div>

          {/* Right */}
          {showRightSidebar && !isMessages && (
            <div
              className={`hidden xl:block ${
                isViewedProfile ? "col-span-4" : "col-span-3"
              }`}
            >
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