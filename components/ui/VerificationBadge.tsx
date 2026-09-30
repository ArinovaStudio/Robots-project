"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | "MORE_INFO_REQUIRED";

interface VerificationBadgeProps {
  status?: VerificationStatus | string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  showTooltip?: boolean;
}

export default function VerificationBadge({
  status = "UNVERIFIED",
  size = "sm",
  className,
  showTooltip = true,
}: VerificationBadgeProps) {
  const isVerified = status === "VERIFIED";

  // Size mappings for container and icon
  const sizeClasses = {
    xs: "h-3.5 w-3.5",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }[size];

  const iconSizes = {
    xs: 9,
    sm: 11,
    md: 13,
    lg: 15,
  }[size];

  const titleText = isVerified
    ? "Verified Profile"
    : status === "PENDING"
    ? "Verification Pending"
    : status === "MORE_INFO_REQUIRED"
    ? "More Information Required"
    : status === "REJECTED"
    ? "Verification Declined"
    : "Unverified Profile";

  return (
    <span
      title={showTooltip ? titleText : undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-full shrink-0 transition-all duration-200 select-none",
        sizeClasses,
        isVerified
          ? "bg-blue-600 text-white shadow-sm"
          : "bg-slate-300 text-slate-600 hover:bg-slate-400",
        className
      )}
    >
      <Check size={iconSizes} strokeWidth={3} />
    </span>
  );
}
