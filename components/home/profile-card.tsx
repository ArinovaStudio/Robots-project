"use client";

import Link from "next/link";
import VerificationBadge from "@/components/ui/VerificationBadge";

export default function ProfileCard({ profile }: any) {
  const isInvestor =
    profile.accountType === "INVESTOR" ||
    Boolean(profile.investor) ||
    Boolean(profile.investorType);
  const displayName =
    profile.companyName || profile.displayName || profile.name || "User";
  const avatarUrl = profile.logoUrl || profile.image;
  const initial = (displayName || "U").charAt(0).toUpperCase();
  const bannerUrl = profile.bannerUrl || null;
  const subtitle =
    profile.type ||
    (isInvestor
      ? profile.investorType ||
        (profile.firmName
          ? `${profile.investorType || "Investor"} · ${profile.firmName}`
          : "Investor")
      : "");
  const description =
    profile.description || profile.investmentThesis || profile.thesis || "";
  const followersCount =
    profile.followersCount ?? profile.stats?.followers ?? 0;
  const connectionsCount =
    profile.connectionsCount ?? profile.stats?.connections ?? 0;
  const verificationStatus =
    profile.user?.verificationStatus || profile.verificationStatus;

  return (
    <>
      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden relative">
        {/* Cover Image */}
        {bannerUrl ? (
          <img src={bannerUrl} alt="Cover" className="h-16 w-full object-cover" />
        ) : (
          <div className="h-16 w-full bg-[#1E3A5F]"></div>
        )}

        <div className="px-4 pb-4 flex flex-col items-center text-center -mt-8 relative">
          {/* Avatar */}
          <Link href={`/profile`} className="block">
            <div
              className="
                flex h-16 w-16 items-center justify-center overflow-hidden
                rounded-full bg-white border-2 border-white
                text-2xl font-bold text-blue-600
              "
            >
              {avatarUrl && avatarUrl !== "null" ? (
                <img 
                  src={avatarUrl} 
                  alt={displayName} 
                  className="h-full w-full object-cover" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = initial;
                  }}
                />
              ) : (
                initial
              )}
            </div>
          </Link>

          {/* Name */}
          <Link href="/profile" className="block mt-3">
            <h2 className="text-base font-semibold text-gray-900 hover:underline cursor-pointer flex items-center justify-center gap-1.5">
              <span>{displayName}</span>
              <VerificationBadge status={verificationStatus} size="xs" />
              {profile.isBoosted && "⭐"}
            </h2>
          </Link>

          {/* Subtitle */}
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">
              {subtitle}
            </p>
          )}

          {/* Description */}
          {description && (
            <p className="mt-3 text-xs leading-5 text-gray-500 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="border-t border-gray-100 py-3 flex flex-col px-4 hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="flex justify-between items-center text-xs font-medium text-gray-500">
            <span>Followers</span>
            <span className="text-blue-600 font-semibold">{followersCount}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-medium text-gray-500 mt-1">
            <span>Connections</span>
            <span className="text-blue-600 font-semibold">{connectionsCount}</span>
          </div>
        </div>
      </div>
    </>
  );
}