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
  Lock,
  Layers,
  Bookmark,
  Users,
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
    {
      icon: Landmark,
      label: "My Pitches & Funding",
      badge: "Pitches",
      href: "/company/pitches",
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
      badge: "Pitches",
      href: "/investors/portal",
    },
    {
      icon: TrendingUp,
      label: "Top Performers",
      badge: "Matches",
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

  const quickLinks = isInvestor
    ? [
        { icon: Bookmark, label: "Saved Pitches & Posts", href: "/profile/saved-posts" },
        { icon: Layers, label: "My Discussions", href: "/profile/my-posts" },
        { icon: Users, label: "Investment Network", href: "/network" },
      ]
    : [
        { icon: Layers, label: "My Posts", href: "/profile/my-posts" },
        { icon: Bookmark, label: "Saved Posts", href: "/profile/saved-posts" },
        { icon: Users, label: "Groups", href: "/groups" },
      ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex flex-col gap-1.5">
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

      {isInvestor && (
        <div className="mx-2 my-1 rounded-lg border border-amber-200/80 bg-amber-50/60 p-2.5 text-[11px] text-amber-800">
          <p className="font-semibold flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-600" />
            Investor Account
          </p>
          <p className="mt-0.5 text-amber-700/90 text-[10.5px] leading-tight">
            Service exchange is reserved for business profiles. Use the Investor Portal to review pitches and deals.
          </p>
        </div>
      )}

      <div className="my-1 border-t border-gray-100" />

      {quickLinks.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-blue-50 text-blue-700 font-semibold"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <item.icon className={`w-[22px] h-[22px] ${isActive ? "text-blue-600" : "text-gray-400"}`} />
            <span className={`text-[15px] ${isActive ? "font-semibold" : "font-medium"}`}>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}