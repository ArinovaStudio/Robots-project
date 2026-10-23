"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, MessageSquare, Users, ChevronRight, Briefcase } from "lucide-react";

export default function InvestorQuickLinks() {
  const pathname = usePathname();

  const links = [
    {
      icon: Bookmark,
      label: "Saved Pitches & Posts",
      sublabel: "Bookmarked pitches & deals",
      href: "/profile/saved-posts",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      icon: MessageSquare,
      label: "My Discussions",
      sublabel: "Your conversations & threads",
      href: "/profile/my-posts",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Users,
      label: "Investment Network",
      sublabel: "Connected founders & businesses",
      href: "/network",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase size={16} />
          </div>
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">Investor Shortcuts</h3>
        </div>
        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
          Quick Access
        </span>
      </div>

      <div className="space-y-1.5">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.label}
              href={link.href}
              className={`
                flex items-center justify-between p-2.5 rounded-lg transition-all duration-150 group
                ${isActive ? "bg-blue-50/80 border border-blue-200/80" : "hover:bg-gray-50 border border-transparent"}
              `}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${link.bgColor} ${link.color}`}>
                  <link.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${isActive ? "text-blue-700" : "text-gray-800 group-hover:text-gray-900"}`}>
                    {link.label}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">{link.sublabel}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
