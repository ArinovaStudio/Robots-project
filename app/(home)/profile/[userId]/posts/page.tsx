"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import UserPostsFeed from "@/components/profile/user-posts-feed";
import RightSidebar from "@/components/home/explore/right-sidebar";

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default function TargetUserPostsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { userId } = resolvedParams;

  return (
    <div className="flex w-full gap-5">
      <div className="w-full flex-1 max-w-3xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <Link 
            href={`/profile/${userId}`} 
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors border border-slate-200 text-slate-600"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">User Posts</h1>
            <p className="text-xs text-slate-500 font-medium">All recent activity</p>
          </div>
        </div>
        
        <UserPostsFeed targetUserId={userId} />

      </div>

      <div className="hidden lg:block w-[320px] shrink-0">
        <div className="sticky top-24">
          <RightSidebar />
        </div>
      </div>

    </div>
  );
}