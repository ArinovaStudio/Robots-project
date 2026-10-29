import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTargetAmount(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val).trim();
  if (!str) return "";

  // If already formatted with k, K, m, M, b, B notation
  if (/^[^\d]*\d+(\.\d+)?[kKmMbB]$/i.test(str)) {
    const clean = str.replace(/^[$₹€£]\s*/, "");
    return `₹${clean}`;
  }

  // Match optional currency prefix, comma-separated numeric part, and any trailing text
  const match = str.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) return str;

  const rawNum = match[2].replace(/,/g, "");
  const remaining = match[4] || "";
  const num = parseFloat(rawNum);

  if (isNaN(num)) return str;

  let formatted = "";
  if (num >= 1_000_000_000) {
    const v = num / 1_000_000_000;
    formatted = (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + "B";
  } else if (num >= 1_000_000) {
    const v = num / 1_000_000;
    formatted = (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + "M";
  } else if (num >= 1_000) {
    const v = num / 1_000;
    formatted = (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + "k";
  } else {
    formatted = num.toString();
  }

  return `₹${formatted}${remaining}`.trim();
}


