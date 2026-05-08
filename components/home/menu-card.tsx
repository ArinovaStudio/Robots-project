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
  ChevronRight,
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
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-slate-900">
          Menu
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          Navigate through your workspace
        </p>
      </div>

      <div className="space-y-2">
        {menu.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.label}
              href={item.locked ? "#" : item.href}
              className={`
                group flex h-12 items-center justify-between
                rounded-2xl border px-4 transition-all duration-200
                ${
                  isActive
                    ? `
                      border-transparent
                      bg-[#111111]
                      text-white
                      shadow-md
                    `
                    : `
                      border-slate-200
                      bg-white
                      text-slate-700
                      hover:border-slate-300
                      hover:bg-slate-50
                    `
                }
                ${
                  item.locked
                    ? "cursor-not-allowed opacity-60"
                    : ""
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-xl
                    transition-all
                    ${
                      isActive
                        ? "bg-white/10"
                        : "bg-slate-100 group-hover:bg-slate-200"
                    }
                  `}
                >
                  <item.icon size={16} />
                </div>

                <span className="text-sm font-medium">
                  {item.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {item.locked ? (
                  <Lock size={14} />
                ) : (
                  <ChevronRight
                    size={14}
                    className={`
                      transition-transform
                      group-hover:translate-x-0.5
                    `}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}