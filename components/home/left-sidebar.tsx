
"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import MenuCard from "./menu-card";
import ProfileCard from "./profile-card";
import { useUserStore } from "@/store/AuthStore";

export default function LeftSidebar() {
  const { status } = useSession();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const user = useUserStore((state) => state.user);
  const userId = user?.id;
  const accountType = user?.accountType;

  const [investorStats, setInvestorStats] = useState<{ connectedCompanies: number; investedIn: number } | null>(null);

  const fetchProfile = useCallback(async () => {
    if (accountType === "INVESTOR") {
      try {
        const res = await fetch(`/api/profile/${userId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setProfileData(json.data);
          if (json.data.stats) {
            setInvestorStats({
              connectedCompanies: json.data.stats.connectedCompanies || 0,
              investedIn: json.data.stats.investedIn || 0
            });
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
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
  }, [accountType, userId]);

  useEffect(() => {
    if (status === "authenticated" && userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProfile();
    }
  }, [status, userId, fetchProfile]);

  if (status === "unauthenticated") {
    return (
      <div className="space-y-4">
        <MenuCard />
      </div>
    );
  }

  // Pre-load from cached company in persistent AuthStore while API revalidates
  const fallbackCompanyProfile = user?.company
    ? {
        ...user.company,
        logoUrl: user.company.logoUrl || user.image,
        followersCount: user.company.followersCount ?? 0,
        connectionsCount: user.company.connectionsCount ?? 0,
        verificationStatus: user.isVerified ? "VERIFIED" : undefined,
      }
    : null;

  // Normalized investor profile matching business ProfileCard shape
  const investorProfile = user?.accountType === "INVESTOR"
    ? profileData?.investor
      ? {
          accountType: "INVESTOR",
          name: profileData.name,
          displayName: profileData.investor.firmName || profileData.name,
          logoUrl: profileData.image,
          bannerUrl: profileData.investor.bannerUrl || null,
          type: profileData.investor.firmName
            ? `${profileData.investor.investorType || "Investor"} · ${profileData.investor.firmName}`
            : profileData.investor.investorType || "Investor",
          description: profileData.investor.investmentThesis || profileData.investor.thesis || "",
          followersCount: profileData.stats?.followers ?? 0,
          connectionsCount: profileData.stats?.connections ?? 0,
          verificationStatus: profileData.verificationStatus || (user.isVerified ? "VERIFIED" : "UNVERIFIED"),
        }
      : {
          accountType: "INVESTOR",
          name: user.name,
          displayName: user.investor?.firmName || user.name,
          logoUrl: user.image,
          bannerUrl: (user.investor as any)?.bannerUrl || null,
          type: user.investor?.firmName
            ? `${user.investor?.investorType || "Investor"} · ${user.investor.firmName}`
            : user.investor?.investorType || "Investor",
          description: (user.investor as any)?.investmentThesis || (user.investor as any)?.thesis || "",
          followersCount: 0,
          connectionsCount: 0,
          verificationStatus: user.isVerified ? "VERIFIED" : "UNVERIFIED",
        }
    : null;

  const activeProfile =
    user?.accountType === "INVESTOR"
      ? investorProfile
      : profileData || fallbackCompanyProfile;

  const isProfileLoading =
    (status === "loading" || (!userId && loading)) && !activeProfile;

  return (
    <div className="space-y-4">
      {activeProfile ? (
        <ProfileCard profile={activeProfile} refreshProfile={fetchProfile} />
      ) : isProfileLoading ? (
        <ProfileCardSkeleton />
      ) : null}
      <MenuCard />
    </div>
  );
}

function ProfileCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="h-16 w-full bg-slate-200 animate-pulse" />
      <div className="relative -mt-8 flex flex-col items-center px-4 pb-4 text-center">
        <div className="h-16 w-16 rounded-full border-2 border-white bg-slate-200 animate-pulse" />
        <div className="mt-3 h-4 w-28 rounded bg-slate-200 animate-pulse" />
        <div className="mt-1.5 h-3 w-20 rounded bg-slate-100 animate-pulse" />
        <div className="mt-3 h-3 w-40 rounded bg-slate-100 animate-pulse" />
      </div>
      <div className="border-t border-gray-100 py-3 px-4 space-y-2">
        <div className="flex justify-between items-center">
          <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
          <div className="h-3 w-8 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
          <div className="h-3 w-8 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}