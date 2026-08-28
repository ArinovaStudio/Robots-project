"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Search,
  ArrowLeftRight,
  Building2,
  Handshake,
  Landmark,
  Compass,
  Lock,
} from "lucide-react";

const menu = [
  {
    icon: Compass,
    label: "Explore",
    href: "/explore",
  },
  {
    icon: Search,
    label: "Search",
    href: "/search",
  },
  {
    icon: ArrowLeftRight,
    label: "Exchange Services",
    href: "/exchange-services",
  },
  {
    icon: Building2,
    label: "Find Businesses",
    href: "/find-businesses",
  },
  {
    icon: Handshake,
    label: "Collaborate",
    href: "/collaborate",
  },
  {
    icon: Landmark,
    label: "Find Investors",
    href: "/find-investors",
    locked: true,
  },
];

export default function MenuCard() {
  const pathname = usePathname();

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex flex-col gap-1.5">
      {menu.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.label}
            href={item.locked ? "#" : item.href}
            className={`
              flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200
              ${isActive
                ? "bg-blue-50 text-blue-700 font-semibold"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }
              ${item.locked ? "cursor-not-allowed opacity-50" : ""}
            `}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`w-[22px] h-[22px] ${isActive ? "text-blue-600" : "text-gray-400"}`} />
              <span className={`text-[15px] ${isActive ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </div>

            <div className="flex items-center">
              {item.locked && (
                <Lock size={16} className={isActive ? "text-blue-600" : "text-gray-400"} />
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}