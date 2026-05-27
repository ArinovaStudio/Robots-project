"use client";

import { useSession } from "next-auth/react";
import ProfileView from "@/components/profile/profile-view";
import { Loader2 } from "lucide-react";

export default function CurrentUserProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-slate-300 h-8 w-8" />
      </div>
    );
  }

  if (!session?.user?.id) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-sm font-medium text-slate-400">
        Please log in to view your profile panel.
      </div>
    );
  }

  return <ProfileView userId={session.user.id} />;
}