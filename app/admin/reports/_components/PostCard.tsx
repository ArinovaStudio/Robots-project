"use client";

import { useState } from "react";
import { MoreVertical, Trash2, Shield, EyeOff, Images } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useSWRMutation from "swr/mutation";

const postActionFetcher = async (
  url: string,
  { arg }: { arg: { action: "SUSPEND" | "DELETE" | "DISMISS" } }
) => {
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  });

  if (!res.ok) throw new Error("Failed");

  return res.json();
};
export function PostCard({ post, mutate }: any) {
  const { trigger, isMutating } = useSWRMutation(
    `/api/admin/reports/${post.postId}`,
    postActionFetcher
  );
  async function handleAction(action: "SUSPEND" | "DELETE" | "DISMISS") {
    try {
      // optimistic UI update
      mutate((current: any) => {
        if (!current) return current;

        return {
          ...current,
          data: current.data.map((p: any) =>
            p.postId === post.postId
              ? {
                  ...p,
                  postStatus:
                    action === "SUSPEND"
                      ? "SUSPENDED"
                      : action === "DELETE"
                      ? "DELETED"
                      : "ACTIVE",
                  totalReports: action === "DISMISS" ? 0 : p.totalReports,
                }
              : p
          ),
        };
      }, false);

      // SWR mutation trigger
      await trigger({ action });

      // revalidate list
      mutate();

      toast.success(`Action ${action} completed`);
    } catch (err) {
      toast.error("Failed to perform action");

      // rollback
      mutate();
    }
  }
  const status = post.postStatus || "ACTIVE";
  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md space-y-4
  ${post.totalReports > 5 ? "border-red-200" : "border-gray-100"}`}
    >
      {/* Top Row */}
      <div className="flex items-start justify-between gap-4">
        {/* Author */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#050a30]">
              {post.author?.name}
            </h3>

            <span className="text-xs text-gray-400">
              {post.author?.company?.companyName}
            </span>
          </div>

          {/* Meta badges */}
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium
          ${
            post.totalReports > 5
              ? "bg-red-100 text-red-700"
              : "bg-orange-50 text-orange-600"
          }`}
            >
              {post.totalReports} Reports
            </span>

            <span className="text-[11px] text-gray-400">
              #{post.postId.slice(0, 7)}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="text-right">
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full
        ${
          post.postStatus === "SUSPENDED"
            ? "bg-yellow-100 text-yellow-700"
            : post.postStatus === "DELETED"
            ? "bg-red-100 text-red-700"
            : "bg-green-50 text-green-600"
        }`}
          >
            {post.postStatus}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-xl bg-gray-50 p-4">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {post.content}
        </p>
      </div>

      {/* Media */}
      {post.media?.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="flex gap-2 items-center text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">
            <Images className="h-4 w-4"/> {post.media.length} attachments
          </span>
        </div>
      )}

      {/* Reports preview */}
      {post.recentReports?.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase">
            Latest Reports
          </p>

          <div className="space-y-2">
            {post.recentReports.map((r: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2"
              >
                <span className="text-xs font-medium text-red-700">
                  {r.reason}
                </span>

                <span className="text-[10px] text-red-500 uppercase tracking-wide">
                  {r.status?.replaceAll("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <Button
          size="sm"
          variant="outline"
          disabled={isMutating}
          onClick={() => handleAction("DISMISS")}
          className="rounded-lg hover:bg-gray-50"
        >
          <EyeOff className="h-4 w-4 mr-1" />
          Dismiss
        </Button>

        <Button
          size="sm"
          disabled={isMutating || status === "SUSPENDED"}
          onClick={() => handleAction("SUSPEND")}
          className="rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white"
        >
          <Shield className="h-4 w-4 mr-1" />
          Suspend
        </Button>

        <Button
          size="sm"
          disabled={isMutating}
          onClick={() => handleAction("DELETE")}
          className="rounded-lg bg-red-500 hover:bg-red-600 text-white"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm space-y-4">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />

      <div className="space-y-2">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-xl" />
        <Skeleton className="h-8 w-20 rounded-xl" />
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>
    </div>
  );
}
