"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface MarqueeTickerProps {
  /** Items to display in the ticker */
  items: Array<{ label: string; icon?: ReactNode }>;
  /** Speed in seconds for one full pass. Lower = faster. Default: 28 */
  duration?: number;
  /** Direction: left (default) or right */
  direction?: "left" | "right";
  className?: string;
}

export default function MarqueeTicker({
  items,
  duration = 28,
  direction = "left",
  className = "",
}: MarqueeTickerProps) {
  // Duplicate items to create seamless loop
  const doubled = [...items, ...items];

  const xFrom = direction === "left" ? "0%" : "-50%";
  const xTo   = direction === "left" ? "-50%" : "0%";

  return (
    <div
      className={`relative overflow-hidden border-y border-white/[0.08] bg-[#1E3A5F] py-3 ${className}`}
    >
      {/* Left fade mask */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24"
        style={{
          background:
            "linear-gradient(to right, #1E3A5F 0%, transparent 100%)",
        }}
      />
      {/* Right fade mask */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24"
        style={{
          background:
            "linear-gradient(to left, #1E3A5F 0%, transparent 100%)",
        }}
      />

      {/* The scrolling track */}
      <motion.div
        className="flex w-max"
        animate={{ x: [xFrom, xTo] }}
        transition={{
          x: {
            duration,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
          },
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-2 whitespace-nowrap px-6 text-[13px] font-semibold uppercase tracking-widest text-white/30"
          >
            {item.icon && (
              <span className="text-white/20">{item.icon}</span>
            )}
            {item.label}
            {/* Separator dot */}
            <span className="ml-4 h-1 w-1 rounded-full bg-white/15" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}
