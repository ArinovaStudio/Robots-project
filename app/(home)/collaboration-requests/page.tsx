import type { Metadata } from "next";
import { Suspense } from "react";
import CollaborationRequestsClient from "./collaboration-requests-client";

export const metadata: Metadata = {
  title: "Collaboration Requests | Connecto",
  description: "Review business collaboration proposals you received and track the pitch requests you sent to investors.",
  alternates: {
    canonical: "/collaboration-requests",
  },
  robots: {
    index: false,
    follow: false,
  },
};
 
export default function CollaborationRequestsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">Loading requests...</div>}>
      <CollaborationRequestsClient />
    </Suspense>
  );
}
