"use client";

import ConnectionRequests from "@/components/home/connection-requests";
import TopInvestors from "@/components/home/top-investors";

export default function RightSidebar() {
  return (
    <div className="space-y-4">
      {/* Top Investors - unlocked, dynamic, and accessible */}
      <TopInvestors />

      {/* Pending Connection Requests */}
      <ConnectionRequests />
    </div>
  );
}
