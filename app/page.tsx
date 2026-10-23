import type { Metadata } from "next";
import NexusLanding from "@/components/landing/nexus-landing";

export const metadata: Metadata = {
  title: "Connecto — Where businesses grow together",
  description: "Connecto connects businesses and investors. Share work, pitch startup ideas, discover collaborators, and connect with investors who believe in your vision.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LandingPage() {
  return <NexusLanding />;
}