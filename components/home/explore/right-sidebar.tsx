"use client";

import ConnectionRequests from "@/components/home/connection-requests";
import SuggestedProfiles from "@/components/SuggestedProfiles";
import TopInvestors from "@/components/home/top-investors";
import InvestorQuickLinks from "./investor-quick-links";
import { useUserStore } from "@/store/AuthStore";

export default function RightSidebar() {
  const { user } = useUserStore();
  const isInvestor = user?.accountType === "INVESTOR";

  return (
    <div className="space-y-4">
      {/* If Investor, show Investor shortcuts (Saved Pitches, Discussions, Network) instead of Add to your feed */}
      {isInvestor ? (
        <InvestorQuickLinks />
      ) : (
        <SuggestedProfiles />
      )}

      {/* Top Investors - unlocked, dynamic, and accessible */}
      <TopInvestors />

      {/* Pending Connection Requests */}
      <ConnectionRequests />
    </div>
  );
}