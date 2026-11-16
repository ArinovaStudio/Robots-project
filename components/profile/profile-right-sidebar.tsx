"use client";

import Link from "next/link";
import TopInvestors from "@/components/home/top-investors";
import TopBusinesses from "@/components/home/top-businesses";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/store/AuthStore";

const FOOTER_LINKS = [
  { label: "About", href: "#" },
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Contact", href: "#" },
];

export default function ProfileRightSidebar() {
  const { data: session } = useSession();
  const accountType =
    useUserStore((state) => state.user?.accountType) ?? session?.user?.accountType;

  return (
    <div className="space-y-4">
      {accountType === "INVESTOR" ? (
        <TopBusinesses />
      ) : accountType === "BUSINESS" ? (
        <TopInvestors />
      ) : null}

      {/* Compact footer, like LinkedIn */}
      <footer className="px-2 pb-4 text-center">
        <nav className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[12px] text-gray-500">
          {FOOTER_LINKS.map((l) => (
            <Link key={l.label} href={l.href} className="hover:text-blue-600 hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="mt-2 text-[11px] text-gray-400">
          <span className="font-semibold text-blue-600">Connecto</span> © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}