
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/store/AuthStore";

import {
  ArrowLeftRight,
  Handshake,
  Landmark,
  Compass,
  Bookmark,
  Sparkles,
  TrendingUp,
  Inbox,
  Mailbox,
  Building2,
  type LucideIcon,
} from "lucide-react";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: string;
  locked?: boolean;
}

export default function MenuCard() {
  const pathname = usePathname();
  const { user } = useUserStore();
  const isInvestor = user?.accountType === "INVESTOR";
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number | null>(null);
  // Pending investment offers investors sent to this business's pitches
  const [pendingOffersCount, setPendingOffersCount] = useState<number | null>(null);

  useEffect(() => {
    if (user?.accountType !== "BUSINESS" || !user?.id) return;
    let active = true;
    fetch("/api/company/pitches/offers")
      .then((res) => res.json())
      .then((json) => {
        if (active && json.success && Array.isArray(json.data)) {
          setPendingOffersCount(json.data.filter((o: any) => o.status === "PENDING").length);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user?.accountType, user?.id]);

  useEffect(() => {
    if (!isInvestor || !user?.id) return;
    let active = true;
    fetch("/api/pitch-requests")
      .then((res) => res.json())
      .then((json) => {
        if (active && json.success && Array.isArray(json.data)) {
          const count = json.data.filter(
            (p: any) => p.status === "PENDING" && p.investorId === user.id
          ).length;
          setPendingRequestsCount(count);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isInvestor, user?.id]);

  const companyMenu: MenuItem[] = [
    {
      icon: Compass,
      label: "Explore",
      href: "/explore",
    },
    {
      icon: ArrowLeftRight,
      label: "B2B Collaboration",
      href: "/marketplace",
    },
    {
      icon: Handshake,
      label: "B2I Collaboration",
      href: "/collaborate",
    },
    {
      icon: Mailbox,
      label: "Collaboration Requests",
      href:
        pendingOffersCount && pendingOffersCount > 0
          ? "/collaboration-requests?tab=investor"
          : "/collaboration-requests",
      badge:
        pendingOffersCount && pendingOffersCount > 0
          ? String(pendingOffersCount)
          : undefined,
    },
  ];

  const investorMenu: MenuItem[] = [
    {
      icon: Compass,
      label: "Explore",
      href: "/explore",
    },
    {
      icon: Sparkles,
      label: "Business collaboration (I2B)",
      href: "/investors/portal",
    },
    {
      icon: Building2,
      label: "Company Pitches",
      href: "/investors/company-pitches",
    },
    {
      icon: TrendingUp,
      label: "Investor collaboration (I2I)",
      href: "/investors/top-performers",
    },
    {
      icon: Inbox,
      label: "Investment Requests",
      href: "/investors/requests",
      badge:
        pendingRequestsCount && pendingRequestsCount > 0
          ? String(pendingRequestsCount)
          : undefined,
    },
  ];

  const menu = isInvestor ? investorMenu : companyMenu;

  // Keep the investor label unchanged; company users manage their own pitches here.
  const belowCollaborateLinks: MenuItem[] = [
    {
      icon: Landmark,
      label: isInvestor ? "Saved Pitches" : "My Pitches",
      href: isInvestor ? "/investors/my-pitches" : "/company/pitches",
    },
    {
      icon: Bookmark,
      label: "Saved Posts",
      href: "/profile/saved-posts",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col gap-1.5">
      {menu.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.label}
            href={item.locked ? "/verification" : item.href}
            aria-disabled={item.locked || undefined}
            title={item.locked ? "Verification required" : undefined}
            className={`
              flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200
              ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : item.locked ? "cursor-not-allowed text-gray-400 opacity-60" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <item.icon
                className={`w-[22px] h-[22px] ${
                  isActive ? "text-blue-600" : "text-gray-400"
                }`}
              />
              <span className={`text-[15px] ${isActive ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </div>

            {item.badge && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                {item.badge}
              </span>
            )}
            {item.locked && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Verify</span>
            )}
          </Link>
        );
      })}

      {/* Kept below Collaborate: only Saved Pitches and Saved Posts */}
      <div className="my-1 border-t border-gray-100" />
      {belowCollaborateLinks.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.locked ? "/verification" : item.href}
            aria-disabled={item.locked || undefined}
            title={item.locked ? "Verification required" : undefined}
            className={`
              flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200
              ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : item.locked ? "cursor-not-allowed text-gray-400 opacity-60" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <item.icon
                className={`w-[22px] h-[22px] ${
                  isActive ? "text-blue-600" : "text-gray-400"
                }`}
              />
              <span className={`text-[15px] ${isActive ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </div>

            {item.badge && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                {item.badge}
              </span>
            )}
            {item.locked && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Verify</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
