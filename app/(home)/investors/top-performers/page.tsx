import type { Metadata } from "next";
import InvestorPortalClient from "../portal/investor-portal-client";

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
  return <InvestorPortalClient view="performers" />;
}
