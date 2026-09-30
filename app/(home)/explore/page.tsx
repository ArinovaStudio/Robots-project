import type { Metadata } from "next";
import ExploreClient from "./explore-client";

export const metadata: Metadata = {
  title: "Explore Feed - Latest B2B Updates & Insights",
  description: "Stay informed with the latest business updates, posts, and industry achievements on Connecto.",
  alternates: {
    canonical: "/explore",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ExplorePage() {
  return <ExploreClient />;
}