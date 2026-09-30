import type { Metadata } from "next";
import CollaborateClient from "./collaborate-client";

export const metadata: Metadata = {
  title: "Business Collaboration & Partner Matching",
  description: "Discover potential business partners, synergistic companies, and B2B collaboration opportunities.",
  alternates: {
    canonical: "/collaborate",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CollaboratePage() {
  return <CollaborateClient />;
}
