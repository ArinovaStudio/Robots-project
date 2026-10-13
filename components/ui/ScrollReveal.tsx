"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

// Qarin-style premium cubic bezier — snappy start, graceful deceleration
const PREMIUM_EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

interface ScrollRevealProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right" | "none";
  delay?: number;
  duration?: number;
  className?: string;
  stagger?: boolean;
}

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.65,
  className = "",
  stagger = false,
}: ScrollRevealProps) {
  const getVariants = () => {
    switch (direction) {
      case "up":
        return { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0 } };
      case "down":
        return { hidden: { opacity: 0, y: -32 }, visible: { opacity: 1, y: 0 } };
      case "left":
        return { hidden: { opacity: 0, x: 32 }, visible: { opacity: 1, x: 0 } };
      case "right":
        return { hidden: { opacity: 0, x: -32 }, visible: { opacity: 1, x: 0 } };
      case "none":
        return { hidden: { opacity: 0 }, visible: { opacity: 1 } };
      default:
        return { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0 } };
    }
  };

  if (stagger) {
    return (
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.08 }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1, delayChildren: delay } },
        }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration, delay, ease: PREMIUM_EASE }}
      variants={getVariants()}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Use inside a <ScrollReveal stagger> container for staggered child items */
export function ScrollRevealItem({
  children,
  className = "",
  direction = "up",
  duration = 0.65,
}: {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
}) {
  const getVariants = () => {
    switch (direction) {
      case "up": return { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0 } };
      case "down": return { hidden: { opacity: 0, y: -32 }, visible: { opacity: 1, y: 0 } };
      case "left": return { hidden: { opacity: 0, x: 32 }, visible: { opacity: 1, x: 0 } };
      case "right": return { hidden: { opacity: 0, x: -32 }, visible: { opacity: 1, x: 0 } };
      case "none": return { hidden: { opacity: 0 }, visible: { opacity: 1 } };
      default: return { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0 } };
    }
  };

  return (
    <motion.div
      variants={getVariants()}
      transition={{ duration, ease: PREMIUM_EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
