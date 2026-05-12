// components/admin/user-card.tsx

"use client";

import Image from "next/image";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import useSWRMutation from "swr/mutation";

import {
  Ban,
  BriefcaseBusiness,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  User2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface UserCardProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: "USER" | "ADMIN";
    status: "ACTIVE" | "SUSPENDED";
    isOnboarded: boolean;
    createdAt: string;
    image?: string | null;
    company?: {
      id: string;
      companyName: string;
      type: string;
      size: number;
      isBoosted: boolean;
    } | null;
  };

  mutateUsers: () => void;
}

async function updateUserStatus(
  url: string,
  { arg }: { arg: { status: "ACTIVE" | "SUSPENDED" } }
) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed");
  }

  return data;
}

export function UserCard({ user, mutateUsers }: UserCardProps) {
  const [loadingAction, setLoadingAction] = useState(false);

  const { trigger } = useSWRMutation(
    `/api/admin/users/${user.id}/status`,
    updateUserStatus
  );

  const handleStatusChange = async () => {
    try {
      setLoadingAction(true);
      const nextStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

      const res = await trigger({
        status: nextStatus,
      });

      toast.success(res.message);

      mutateUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <Card className="rounded-3xl border-0 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-muted">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || "User"}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User2 className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div>
              <h2 className="text-lg font-bold text-[#050a30]">
                {user.name || "Unnamed User"}
              </h2>

              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  user.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {user.status}
              </span>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                {user.role}
              </span>

              {user.isOnboarded && (
                <span className="flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
                  <CheckCircle2 className="h-3 w-3" />
                  Onboarded
                </span>
              )}

              {user.company?.isBoosted && (
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                  Boosted
                </span>
              )}
            </div>

            {user.company && (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {user.company.companyName}
                </div>

                <div>{user.company.type}</div>

                <div>{user.company.size} Employees</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={user.status === "ACTIVE" ? "destructive" : "default"}
            onClick={handleStatusChange}
            disabled={loadingAction}
            className="rounded-xl"
          > 
            {user.status === "ACTIVE" ? (
              <>
                <Ban className="mr-2 h-4 w-4" />
                Suspend
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function UserCardSkeleton() {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Skeleton className="h-16 w-16 rounded-2xl" />

          <div className="space-y-3">
            {/* Name */}
            <Skeleton className="h-5 w-40 rounded-md" />

            {/* Email */}
            <Skeleton className="h-4 w-56 rounded-md" />

            {/* Badges */}
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            {/* Company */}
            <div className="flex gap-3">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>
          </div>
        </div>

        {/* Button */}
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  );
}
