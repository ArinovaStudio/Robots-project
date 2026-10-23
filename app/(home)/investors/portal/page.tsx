import type { Metadata } from "next";
import { Suspense } from "react";
import InvestorPortalClient from "./investor-portal-client";

export const metadata: Metadata = {
  title: "Investor Portal - Ideas, Products & Pitches | Connecto",
  description: "Browse curated startup ideas, live products, and investment pitches. Discover high-performing companies matching your preferred sectors and stages.",
  alternates: {
    canonical: "/investors/portal",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function InvestorPortalPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Loading portal...</div>}>
      <InvestorPortalClient />
    </Suspense>
  );
}
