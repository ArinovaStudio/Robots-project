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
    <section className="mx-auto max-w-5xl py-6">
      <h1 className="mb-4 text-xl font-bold text-[#172033]">Top Performing Investors</h1>
      <InvestorDirectory />
    </section>
  );
}
