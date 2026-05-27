"use client";

import { use } from "react";
import ProfileView from "@/components/profile/profile-view";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default function TargetUserProfilePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { userId } = resolvedParams;

  return <ProfileView userId={userId} />;
}