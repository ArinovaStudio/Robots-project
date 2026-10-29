import type { Metadata } from "next";
import { Suspense } from "react";
import InvestorPitchesClient from "./investor-pitches-client";

export const metadata: Metadata = {
  title: "My Pitches & Offers | Investor Deal Flow",
  description: "View and manage your created pitches, submitted investment offers, and evaluated startup deals on Connecto.",
  alternates: {
    canonical: "/investors/my-pitches",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function InvestorMyPitchesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Loading your pitches...</div>}>
      <InvestorPitchesClient />
    </Suspense>
  );
}
