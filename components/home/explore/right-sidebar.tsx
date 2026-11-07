"use client";

import ConnectionRequests from "@/components/home/connection-requests";
import TopInvestors from "@/components/home/top-investors";
import TopBusinesses from "@/components/home/top-businesses";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/AuthStore";

export default function RightSidebar() {
  const { data: session } = useSession();
  const accountType = useUserStore((state) => state.user?.accountType) ?? session?.user?.accountType;

  return (
    <div className="space-y-4">
      {accountType === "INVESTOR" ? <TopBusinesses /> : accountType === "BUSINESS" ? <TopInvestors /> : null}

      {/* Pending Connection Requests */}
      <ConnectionRequests />
    </div>
  );
}
