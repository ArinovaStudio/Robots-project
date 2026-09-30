import type { Metadata } from "next";
import MarketplaceClient from "./marketplace-client";

export const metadata: Metadata = {
  title: "B2B Marketplace - AI Service Matching",
  description: "Discover tailored B2B service buyers and verified suppliers matched by AI vector similarity.",
  alternates: {
    canonical: "/marketplace",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function MarketplacePage() {
  return <MarketplaceClient />;
}