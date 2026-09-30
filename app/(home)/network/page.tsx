import type { Metadata } from "next";
import NetworkClient from "./network-client";

export const metadata: Metadata = {
  title: "My Business Network - Connections & Requests",
  description: "Manage your B2B network connections, pending requests, and business partnerships on Connecto.",
  alternates: {
    canonical: "/network",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function NetworkPage() {
  return <NetworkClient />;
}
