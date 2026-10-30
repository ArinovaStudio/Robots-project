"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/store/AuthStore";

import {
  ArrowLeftRight,
  Building2,
  Handshake,
  Landmark,
  Compass,
  Bookmark,
  Sparkles,
  TrendingUp,
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

  const companyMenu: MenuItem[] = [
    {
      icon: Compass,
      label: "Explore",
      href: "/explore",
    },
    {
      icon: ArrowLeftRight,
      label: "Marketplace",
      href: "/marketplace",
    },
    {
      icon: Building2,
      label: "Directory",
      href: "/directory",
    },
    {
      icon: Handshake,
      label: "Collaborate",
      href: "/collaborate",
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
      label: "Investor Portal",
      href: "/investors/portal",
    },
    {
      icon: TrendingUp,
      label: "Top Performers",
      href: "/investors/portal?tab=performers",
    },
    {
      icon: Building2,
      label: "Directory",
      href: "/directory",
    },
    {
      icon: Handshake,
      label: "Collaborate",
      href: "/collaborate",
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
            href={item.href}
            className={`
              flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200
              ${isActive
                ? "bg-blue-50 text-blue-700 font-semibold"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`w-[22px] h-[22px] ${isActive ? "text-blue-600" : "text-gray-400"}`} />
              <span className={`text-[15px] ${isActive ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </div>

            {item.badge && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                {item.badge}
              </span>
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
            href={item.href}
            className={`
              flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200
              ${isActive
                ? "bg-blue-50 text-blue-700 font-semibold"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`w-[22px] h-[22px] ${isActive ? "text-blue-600" : "text-gray-400"}`} />
              <span className={`text-[15px] ${isActive ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </div>

            {item.badge && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
