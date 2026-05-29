"use client";

import Link from "next/link";
import { ArrowLeft, Bookmark } from "lucide-react";
import SavedPostsFeed from "@/components/profile/saved-posts-feed";
import { useUserStore } from "@/store/AuthStore";
import RightSidebar from "@/components/home/explore/right-sidebar";

export default function SavedPostsPage() {
  const { user } = useUserStore();

  return (
    <div className="flex w-full gap-5">
      <div className="w-full flex-1 max-w-3xl space-y-6">
        
        <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          {user?.id && (
            <Link 
              href={`/profile/${user.id}`} 
              className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors border border-slate-200 text-slate-600"
            >
              <ArrowLeft size={20} />
            </Link>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Saved Posts
            </h1>
            <p className="text-xs text-slate-500 font-medium">Posts you've bookmarked for later</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
            <Bookmark size={24} />
          </div>
        </div>

        <SavedPostsFeed />

      </div>

      <div className="hidden lg:block w-[320px] shrink-0">
        <div className="sticky top-24">
          <RightSidebar />
        </div>
      </div>

    </div>
  );
}