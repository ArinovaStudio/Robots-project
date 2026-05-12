"use client";

import useSWRMutation from "swr/mutation";

import { BadgeCheck, Calendar, Pencil, Trash2, Wallet } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

import { Card } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { toast } from "sonner";

import PlanFormDialog from "./FormDialog";

interface Plan {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  duration: number;
  isActive: boolean;
  givesBoost: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    subscriptions?: number;
    transactions?: number;
  };
}

interface PlanCardProps {
  plan: Plan;
  mutatePlans: () => void;
}

async function deletePlan(url: string) {
  const res = await fetch(url, {
    method: "DELETE",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message);
  }

  return data;
}

async function togglePlan(
  url: string,
  {
    arg,
  }: {
    arg: {
      isActive: boolean;
    };
  }
) {
  const res = await fetch(url, {
    method: "PUT",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(arg),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message);
  }

  return data;
}

export function PlanCard({ plan, mutatePlans }: PlanCardProps) {
  const { trigger: deleteTrigger, isMutating: deleting } = useSWRMutation(
    `/api/admin/plans/${plan.id}`,
    deletePlan
  );

  const { trigger: toggleTrigger, isMutating: toggling } = useSWRMutation<
    any,
    any,
    string,
    { isActive: boolean }
  >(`/api/admin/plans/${plan.id}`, togglePlan);

  const handleDelete = async () => {
    try {
      const res = await deleteTrigger();

      mutatePlans();

      toast.success(res.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  };

  const handleToggle = async () => {
    try {
      const res = await toggleTrigger({
        isActive: !plan.isActive,
      });

      mutatePlans();

      toast.success(res.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  };

  return (
    <Card className="rounded-3xl border-0 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Left */}
        <div className="space-y-3">
          {/* Top */}
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-[#050a30]">{plan.name}</h2>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                plan.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {plan.isActive ? "Active" : "Inactive"}
            </span>

            {plan.givesBoost && (
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                Boost Plan
              </span>
            )}
          </div>

          {/* Description */}
          {plan.description && (
            <p className="max-w-2xl text-sm text-muted-foreground">
              {plan.description}
            </p>
          )}

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />₹{plan.price}
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {plan.duration} Days
            </div>

            {typeof plan._count?.subscriptions === "number" && (
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4" />
                {plan._count.subscriptions} Subscribers
              </div>
            )}

            {typeof plan._count?.transactions === "number" && (
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                {plan._count.transactions} Transactions
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Edit */}
          <PlanFormDialog plan={plan} mutatePlans={mutatePlans}>
            <Button variant="outline" className="rounded-xl">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </PlanFormDialog>

          {/* Toggle */}
          <Button
            variant={plan.isActive ? "outline" : "default"}
            onClick={handleToggle}
            disabled={toggling}
            className="rounded-xl"
          >
            {plan.isActive ? "Deactivate" : "Activate"}
          </Button>

          {/* Delete */}
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-xl"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function PlanCardSkeleton() {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-7 w-40 rounded-md" />

          <Skeleton className="h-6 w-20 rounded-full" />
        </div>

        <Skeleton className="h-4 w-full rounded-md" />

        <Skeleton className="h-4 w-2/3 rounded-md" />

        <div className="flex gap-3">
          <Skeleton className="h-5 w-24 rounded-md" />

          <Skeleton className="h-5 w-24 rounded-md" />

          <Skeleton className="h-5 w-28 rounded-md" />
        </div>

        <div className="flex gap-3 pt-2">
          <Skeleton className="h-10 w-24 rounded-xl" />

          <Skeleton className="h-10 w-28 rounded-xl" />

          <Skeleton className="h-10 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
