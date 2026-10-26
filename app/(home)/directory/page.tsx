import type { Metadata } from "next";
import { Suspense } from "react";
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
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Loading directory...</div>}>
      <DirectoryClient />
    </Suspense>
  );
}