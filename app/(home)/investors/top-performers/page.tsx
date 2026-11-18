import type { Metadata } from "next";
import InvestorDirectory from "@/components/investors/investor-directory";

export const metadata: Metadata = {
  title: "Top Performing Companies | Connecto",
  description: "Explore companies doing good in your selected investor preferences.",
  alternates: {
    canonical: "/investors/top-performers",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function InvestorTopPerformersPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-24">
      <InvestorDirectory />
    </div>
  );
}
