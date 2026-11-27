import type { Metadata } from "next";
import VerificationAccessGate from "@/components/VerificationAccessGate";
import { Suspense } from "react";
import CompanyPitchesClient from "./company-pitches-client";

export const metadata: Metadata = {
  title: "Company Pitches | Investor Deal Flow",
  description:
    "Browse pitches published by businesses, rate them, and send offer requests directly to founders.",
  alternates: {
    canonical: "/investors/company-pitches",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function CompanyPitchesPage() {
  return (
    <VerificationAccessGate accountType="INVESTOR" mode="blur">
      <Suspense
        fallback={<div className="p-8 text-center text-sm text-gray-500">Loading company pitches...</div>}
      >
        <CompanyPitchesClient />
      </Suspense>
    </VerificationAccessGate>
  );
}
