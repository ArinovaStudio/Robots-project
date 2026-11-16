import type { Metadata } from "next";
import { Suspense } from "react";
import InvestorRequestsClient from "./investor-requests-client";

export const metadata: Metadata = {
  title: "Investment Requests | Connecto",
  description: "Review and manage pitches and collaboration requests sent by founders and startups.",
  alternates: {
    canonical: "/investors/requests",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function InvestorRequestsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Loading requests...</div>}>
      <InvestorRequestsClient />
    </Suspense>
  );
}
