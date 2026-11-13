import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTargetAmount(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val).trim();
  if (!str) return "";

  const curMatch = str.match(/^([$₹€£])/);
  const currency = curMatch ? curMatch[1] : "₹";
  const withoutCurrency = str.replace(/^[$₹€£]\s*/, "").trim();

  // If formatted with Cr / Crore notation (e.g. "1Cr", "1 Cr", "2.5 Crore")
  const crMatch = withoutCurrency.match(/^([\d,]+(?:\.\d+)?)\s*(cr|crore|crores)\.?$/i);
  if (crMatch) {
    return `${currency}${crMatch[1]} Cr`;
  }

  // If formatted with L / Lakh / Lac notation (e.g. "50L", "50 Lakh", "25 Lacs")
  const lakhMatch = withoutCurrency.match(/^([\d,]+(?:\.\d+)?)\s*(l|lac|lakh|lakhs|lacs)\.?$/i);
  if (lakhMatch) {
    return `${currency}${lakhMatch[1]} L`;
  }

  // If already formatted with k, K, m, M, b, B notation (e.g. "500k", "2M")
  const suffixMatch = withoutCurrency.match(/^([\d,]+(?:\.\d+)?)\s*([kKmMbB])$/);
  if (suffixMatch) {
    return `${currency}${suffixMatch[1]}${suffixMatch[2]}`;
  }

  const cleanNumeric = withoutCurrency.replace(/,/g, "");
  const num = parseFloat(cleanNumeric);

  if (isNaN(num)) return str;

  let formatted = "";
  if (num >= 10_000_000) {
    const v = num / 10_000_000;
    formatted = (v % 1 === 0 ? v.toFixed(0) : v.toFixed(2).replace(/\.?0+$/, "")) + " Cr";
  } else if (num >= 100_000) {
    const v = num / 100_000;
    formatted = (v % 1 === 0 ? v.toFixed(0) : v.toFixed(2).replace(/\.?0+$/, "")) + " L";
  } else if (num >= 1_000) {
    const v = num / 1_000;
    formatted = (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + "k";
  } else {
    formatted = num.toString();
  }

  return `${currency}${formatted}`.trim();
}


