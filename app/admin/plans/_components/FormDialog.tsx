"use client";

import React, { useState } from "react";
import useSWRMutation from "swr/mutation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 day"),
  isActive: z.boolean(),
  givesBoost: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface Plan {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  duration: number;
  isActive: boolean;
  givesBoost: boolean;
}

interface Props {
  children: React.ReactNode;

  mutatePlans?: () => void;

  plan?: Plan;
}

async function submitPlan(
  url: string,
  {
    arg,
  }: {
    arg: {
      method: "POST" | "PUT";
      body: FormValues;
    };
  }
) {
  const res = await fetch(url, {
    method: arg.method,

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify(arg.body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message);
  }

  return data;
}

export default function PlanFormDialog({ children, mutatePlans, plan }: Props) {
  const [open, setOpen] = useState(false);

  const isEdit = !!plan;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof formSchema>, any, z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema),

    defaultValues: {
      name: plan?.name || "",
      description: plan?.description || "",
      price: plan?.price || 0,
      duration: plan?.duration || 30,
      isActive: plan?.isActive ?? true,
      givesBoost: plan?.givesBoost ?? true,
    },
  });

  const isActive = watch("isActive");

  const givesBoost = watch("givesBoost");

  const { trigger, isMutating } = useSWRMutation(
    isEdit ? `/api/admin/plans/${plan.id}` : "/api/admin/plans",

    submitPlan
  );

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await trigger({
        method: isEdit ? "PUT" : "POST",

        body: values,
      });

      toast.success(res.message);

      mutatePlans?.();

      setOpen(false);

      if (!isEdit) {
        reset();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-[560px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isEdit ? "Edit Plan" : "Create New Plan"}
          </DialogTitle>

          <DialogDescription>
            {isEdit
              ? "Update your subscription plan details."
              : "Create a new subscription plan for users."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-3">
          {/* Name */}
          <div className="space-y-2">
            <Label>Plan Name</Label>

            <Input
              placeholder="Pro Plan"
              {...register("name")}
              disabled={isMutating}
              className="h-11 rounded-xl"
            />

            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>

            <Textarea
              disabled={isMutating}
              placeholder="Describe this plan..."
              {...register("description")}
              className="min-h-[100px] rounded-2xl"
            />
          </div>

          {/* Price & Duration */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Price (₹)</Label>

              <Input
                type="number"
                disabled={isMutating}
                {...register("price")}
                className="h-11 rounded-xl"
              />

              {errors.price && (
                <p className="text-sm text-red-500">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Duration (Days)</Label>

              <Input
                type="number"
                disabled={isMutating}
                {...register("duration")}
                className="h-11 rounded-xl"
              />

              {errors.duration && (
                <p className="text-sm text-red-500">
                  {errors.duration.message}
                </p>
              )}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-4 rounded-2xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Active Plan</p>

                <p className="text-sm text-muted-foreground">
                  Users can purchase this plan
                </p>
              </div>

              <Switch
                checked={isActive}
                disabled={isMutating}
                onCheckedChange={(value) => setValue("isActive", value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Gives Boost</p>

                <p className="text-sm text-muted-foreground">
                  This plan enables profile boosts
                </p>
              </div>

              <Switch
                checked={givesBoost}
                disabled={isMutating}
                onCheckedChange={(value) => setValue("givesBoost", value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isMutating}
              className="rounded-xl"
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isMutating} className="rounded-xl">
              {isEdit ? "Update Plan" : "Create Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
