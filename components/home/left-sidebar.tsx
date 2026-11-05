
"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import MenuCard from "./menu-card";
import ProfileCard from "./profile-card";
import Link from "next/link";
import { useUserStore } from "@/store/AuthStore";
import type { User } from "@/store/AuthStore";
import { Pencil } from "lucide-react";
import EditProfileModal from "../modals/edit-profile-modal";

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
        if (json.success && json.data?.stats) {
          setInvestorStats({
            connectedCompanies: json.data.stats.connectedCompanies || 0,
            investedIn: json.data.stats.investedIn || 0
          });
        }
      } catch {
        // ignore
      } finally {
        setProfileData(null);
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

  const activeProfile = profileData || fallbackCompanyProfile;
  const isProfileLoading =
    (status === "loading" || (!userId && loading)) && !activeProfile && !user?.investor;

  return (
    <div className="space-y-4">
      {user?.accountType === "INVESTOR" ? (
        <InvestorSidebarCard user={user} stats={investorStats} refreshProfile={fetchProfile} />
      ) : activeProfile ? (
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

function InvestorSidebarCard({
  user,
  stats,
  refreshProfile,
}: {
  user: User;
  stats: { connectedCompanies: number; investedIn: number } | null;
  refreshProfile: () => void;
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const investor = user.investor;
  const displayName = user.name || "Investor";

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white relative">
        <div className="h-16 bg-[#1E3A5F]" />
        
        {/* Edit Button */}
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="
            absolute top-3 right-3 rounded-full p-1.5
            bg-white/20 hover:bg-white/40 transition text-white backdrop-blur-sm
          "
          title="Edit Profile"
        >
          <Pencil size={14} />
        </button>

        <div className="relative -mt-8 px-4 pb-4 text-center">
          <Link href="/profile" className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white text-2xl font-bold text-blue-700">
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

          {/* Dynamic Connected Companies & Invested In badges */}
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3 text-left">
            <div className="rounded-lg bg-blue-50/80 p-2 text-center">
              <span className="block text-base font-bold text-blue-900">{stats?.connectedCompanies ?? 0}</span>
              <span className="text-[10px] font-semibold text-blue-700 leading-tight block">connected companies</span>
            </div>
            <div className="rounded-lg bg-emerald-50/80 p-2 text-center">
              <span className="block text-base font-bold text-emerald-900">{stats?.investedIn ?? 0}</span>
              <span className="text-[10px] font-semibold text-emerald-700 leading-tight block">invested in</span>
            </div>
          </div>

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

      {isEditModalOpen && (
        <EditProfileModal
          profile={{
            ...investor,
            name: user.name,
            logoUrl: user.image,
            accountType: "INVESTOR",
          }}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            refreshProfile();
          }}
        />
      )}
    </>
  );
}