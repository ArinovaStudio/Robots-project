"use client";

import { Trash2, Shield, EyeOff, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useSWRMutation from "swr/mutation";
import MediaSlider from "@/components/home/media-slider"; 

const postActionFetcher = async (url: string, { arg }: { arg: { action: "SUSPEND" | "DELETE" | "DISMISS" } }) => {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  if (!res.ok) throw new Error("Failed");
  return res.json();
};

export function PostCard({ post, mutate }: any) {
  const { trigger, isMutating } = useSWRMutation(`/api/admin/reports/${post.postId}`, postActionFetcher);
  
  async function handleAction(action: "SUSPEND" | "DELETE" | "DISMISS") {
    try {
      mutate((current: any) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map((p: any) =>
            p.postId === post.postId
              ? {
                  ...p,
                  postStatus: action === "SUSPEND" ? "SUSPENDED" : action === "DELETE" ? "DELETED" : "ACTIVE",
                  totalReports: action === "DISMISS" ? 0 : p.totalReports,
                }
              : p
          ),
        };
      }, false);

      await trigger({ action });
      mutate();
      toast.success(`Action ${action} completed`);
    } catch (err) {
      toast.error("Failed to perform action");
      mutate();
    }
  }

  const status = post.postStatus || "ACTIVE";
  const companyName = post.author?.company?.companyName || "Unknown Company";
  const logoUrl = post.author?.company?.logoUrl;

  return (
    <div className={`rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 space-y-4 ${post.totalReports > 5 ? "border-red-200" : "border-gray-100"}`}>
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100 border border-slate-200">
             {logoUrl ? (
               <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
             ) : (
               <div className="flex h-full w-full items-center justify-center font-bold text-slate-400">
                 {companyName.charAt(0)}
               </div>
             )}
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-[#050a30]">{companyName}</h3>
          </div>
        </div>

        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            status === "SUSPENDED" ? "bg-yellow-100 text-yellow-700"
          : status === "DELETED"   ? "bg-red-100 text-red-700"
          : "bg-green-50 text-green-600"
        }`}>
          {status}
        </span>
      </div>

      {/* Grouped Report Stats */}
      <div className="flex flex-wrap items-center gap-2 bg-red-50/50 p-3 rounded-xl border border-red-100">
        <div className="flex items-center gap-1.5 mr-2 text-red-700 font-bold text-sm">
          <AlertTriangle size={16} />
          {post.totalReports} Total Reports
        </div>
        <div className="h-4 w-px bg-red-200 hidden sm:block"></div>
        {post.groupedReports?.map((stat: any, idx: number) => (
          <span key={idx} className="bg-white border border-red-200 text-red-600 text-[11px] font-semibold px-2.5 py-0.5 rounded-md shadow-sm">
            {stat.reason.replace(/_/g, " ")} <span className="text-red-400 ml-1">×{stat.count}</span>
          </span>
        ))}
        {post.pendingReportsCount > 0 && (
          <span className="ml-auto text-[11px] font-semibold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200">
            {post.pendingReportsCount} Pending
          </span>
        )}
      </div>

      {/* Post Content */}
      {post.content && (
        <div className="rounded-xl bg-gray-50 p-4 border border-gray-100">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{post.content}</p>
        </div>
      )}

      {post.media?.length > 0 && (
        <MediaSlider media={post.media} />
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t border-gray-100 mt-2">
        <Button size="sm" variant="outline" disabled={isMutating} onClick={() => handleAction("DISMISS")} className="rounded-lg hover:bg-gray-50 flex-1 sm:flex-none">
          <EyeOff className="h-4 w-4 mr-1.5" /> Dismiss
        </Button>
        <Button size="sm" disabled={isMutating || status === "SUSPENDED"} onClick={() => handleAction("SUSPEND")} className="rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white flex-1 sm:flex-none">
          <Shield className="h-4 w-4 mr-1.5" /> Suspend
        </Button>
        <Button size="sm" disabled={isMutating} onClick={() => handleAction("DELETE")} className="rounded-lg bg-red-500 hover:bg-red-600 text-white flex-1 sm:flex-none">
          <Trash2 className="h-4 w-4 mr-1.5" /> Delete
        </Button>
      </div>
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm space-y-4 border border-slate-100">
      <div className="flex justify-between">
        <div className="flex gap-3">
          <Skeleton circle className="h-10 w-10" />
          <div className="flex flex-col justify-center">
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}