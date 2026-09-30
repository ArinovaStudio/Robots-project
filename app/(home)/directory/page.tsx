import type { Metadata } from "next";
import DirectoryClient from "./directory-client";

export const metadata: Metadata = {
  title: "B2B Business Directory - Find Verified Companies",
  description: "Browse and discover top-rated verified businesses, service providers, and B2B partners in the Connecto directory.",
  alternates: {
    canonical: "/directory",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DirectoryPage() {
  return <DirectoryClient />;
}