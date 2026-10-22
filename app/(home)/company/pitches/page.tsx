import type { Metadata } from "next";
import CompanyPitchesClient from "./company-pitches-client";

export const metadata: Metadata = {
  title: "My Pitches & Funding Dashboard | Connecto",
  description: "Manage your company pitches, track investor views, review investment offers, and ask other companies for help building your ideas.",
  alternates: {
    canonical: "/company/pitches",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function CompanyPitchesPage() {
  return <CompanyPitchesClient />;
}
