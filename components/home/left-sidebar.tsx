
"use client";

import { useEffect, useState } from "react";
import MenuCard from "./menu-card";
import ProfileCard from "./profile-card";
import Link from "next/link";
import { useUserStore } from "@/store/AuthStore";
import type { User } from "@/store/AuthStore";

export default function LeftSidebar() {
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const user = useUserStore((state) => state.user);

  const fetchProfile = async () => {
    if (user?.accountType === "INVESTOR") {
      setProfileData(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/company/profile");
      const json = await res.json();
      if (json.success) {
        setProfileData(json.data);
      }
    } catch {
      console.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.accountType]);

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Placeholder for menu skeleton or empty space */}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {user?.accountType === "INVESTOR" ? (
        <InvestorSidebarCard user={user} />
      ) : profileData ? (
        <ProfileCard profile={profileData} refreshProfile={fetchProfile} />
      ) : null}
      <MenuCard />
    </div>
  );
}

function InvestorSidebarCard({ user }: { user: User }) {
  const investor = user.investor;
  const displayName = user.name || "Investor";

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="h-16 bg-gradient-to-r from-indigo-700 via-blue-600 to-sky-400" />
      <div className="relative -mt-8 px-4 pb-4 text-center">
        <Link href="/profile" className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white text-2xl font-bold text-blue-700 shadow-sm">
          {user.image ? (
            <img src={user.image} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </Link>
        <Link href="/profile" className="mt-3 block truncate text-base font-semibold text-gray-900 hover:underline">
          {displayName}
        </Link>
        <p className="mt-1 text-xs text-gray-500">
          {investor?.firmName || investor?.investorType || "Investor"}
        </p>
        {investor?.sectors?.length ? (
          <p className="mt-3 line-clamp-2 text-xs leading-5 text-gray-500">
            Investing in {investor.sectors.join(", ")}
          </p>
        ) : null}
        {investor?.investmentRange ? (
          <p className="mt-2 text-xs font-medium text-blue-700">
            Typical range: {investor.investmentRange}
          </p>
        ) : null}
      </div>
    </div>
  );
}