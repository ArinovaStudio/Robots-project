"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log Web Vitals or send to analytics endpoint in production
    if (process.env.NODE_ENV === "development") {
      console.log(`[Web Vitals] ${metric.name}: ${Math.round(metric.value)}ms (rating: ${metric.rating})`);
    }
  });

  return null;
}
