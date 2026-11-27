import type { Metadata } from "next";
import { Suspense } from "react";
import InvestorPortalClient from "./investor-portal-client";

export const metadata: Metadata = {
  title: "Business Collaboration (I2B) | Connecto",
  description: "Browse all business profiles, view their details, and connect with companies directly.",
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
      <InvestorPortalClient view="performers" />
    </Suspense>
  );
}
