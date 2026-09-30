import type { Metadata } from "next";
import LandingClient from "./landing-client";

export const metadata: Metadata = {
  title: "Connecto - Business Network to Exchange Services",
  description: "Find and offer B2B services. Connect with verified businesses, exchange services, and discover AI-matched partners.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LandingPage() {
  return <LandingClient />;
}