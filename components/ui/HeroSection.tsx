"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import MarqueeTicker from "./MarqueeTicker";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ─── Horizontal bar — grows left→right ───────────────────────────────────────
function HBar({ delay, top }: { delay: number; top: string }) {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 1.0, delay, ease: EASE }}
      className="absolute left-0 right-0 h-px bg-white/[0.09]"
      style={{ top, transformOrigin: "left center" }}
    />
  );
}

// ─── Vertical bar — grows top→bottom ─────────────────────────────────────────
function VBar({ delay, left }: { delay: number; left: string }) {
  return (
    <motion.div
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 1.0, delay, ease: EASE }}
      className="absolute top-0 bottom-0 w-px bg-white/[0.09]"
      style={{ left, transformOrigin: "top center" }}
    />
  );
}

// ─── Content item (slide up + fade) ──────────────────────────────────────────
const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.72, ease: EASE },
  },
};

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.11, delayChildren: 0.55 },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: EASE, delay: 0.42 },
  },
};

// Clips text reveal from beneath
function RevealLine({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div variants={itemVariants}>{children}</motion.div>
    </div>
  );
}

// ─── HeroSection ─────────────────────────────────────────────────────────────

interface TickerItem { label: string; icon?: ReactNode }

interface HeroSectionProps {
  badge?: string;
  title: string;
  highlight?: string;
  subtitle: string;
  cta?: ReactNode;
  stat1?: { value: string; label: string };
  stat2?: { value: string; label: string };
  /** Items for the scrolling ticker strip below the hero */
  ticker?: TickerItem[];
  /** Ticker speed in seconds. Default 28 */
  tickerDuration?: number;
  className?: string;
}

export default function HeroSection({
  badge,
  title,
  highlight,
  subtitle,
  cta,
  stat1,
  stat2,
  ticker,
  tickerDuration = 28,
  className = "",
}: HeroSectionProps) {
  const titleParts = highlight
    ? title.split(new RegExp(`(${highlight})`, "i"))
    : [title];

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-[#1E3A5F] text-white border border-[#1E3A5F] ${className}`}>

      {/* ── Background animated grid bars ── */}
      {/* Outer wrapper: mask fades bars from transparent at top → fully visible ~45% down */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 45%)",
          maskImage: "linear-gradient(to bottom, transparent 0%, black 45%)",
        }}
      >
        {/* Horizontal bars — staggered left-to-right grow */}
        <HBar delay={0.0}  top="18%" />
        <HBar delay={0.08} top="36%" />
        <HBar delay={0.16} top="56%" />
        <HBar delay={0.24} top="76%" />

        {/* Vertical bars — staggered top-to-bottom grow */}
        <VBar delay={0.04} left="10%" />
        <VBar delay={0.12} left="30%" />
        <VBar delay={0.20} left="50%" />
        <VBar delay={0.28} left="70%" />
        <VBar delay={0.36} left="90%" />
      </div>

      {/* Edge border lines — NOT masked, draw across full width */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, delay: 0.0, ease: EASE }}
        className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-white/10"
        style={{ transformOrigin: "left center" }}
      />
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, delay: 0.05, ease: EASE }}
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-white/10"
        style={{ transformOrigin: "left center" }}
      />

      {/* ── Content ── */}
      <motion.div
        className="relative z-10 mx-auto max-w-3xl px-8 py-16 sm:px-12 sm:py-20 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge pill */}
        {badge && (
          <motion.div variants={badgeVariants} className="mb-6 inline-flex">
            <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/90">
              {badge}
            </span>
          </motion.div>
        )}

        {/* Title — clip reveal */}
        <div className="mb-5 text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight">
          <RevealLine>
            {titleParts.map((part, i) =>
              highlight && part.toLowerCase() === highlight.toLowerCase() ? (
                <span
                  key={i}
                  className="text-blue-300"
                >
                  {part}
                </span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </RevealLine>
        </div>

        {/* Subtitle */}
        <RevealLine className="mb-8">
          <p className="text-base sm:text-lg text-white/50 leading-relaxed font-medium max-w-xl mx-auto">
            {subtitle}
          </p>
        </RevealLine>

        {/* CTA */}
        {cta && (
          <motion.div variants={itemVariants} className="mb-10">
            {cta}
          </motion.div>
        )}

        {/* Stats with flanking lines */}
        {(stat1 || stat2) && (
          <motion.div
            variants={itemVariants}
            className="mt-4 flex items-center justify-center gap-8"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 1.1, ease: EASE }}
              className="h-px flex-1 max-w-[80px] bg-white/10"
              style={{ transformOrigin: "left center" }}
            />

            {stat1 && (
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{stat1.value}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mt-0.5">
                  {stat1.label}
                </p>
              </div>
            )}

            {stat1 && stat2 && <div className="h-8 w-px bg-white/10" />}

            {stat2 && (
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{stat2.value}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mt-0.5">
                  {stat2.label}
                </p>
              </div>
            )}

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 1.2, ease: EASE }}
              className="h-px flex-1 max-w-[80px] bg-white/10"
              style={{ transformOrigin: "right center" }}
            />
          </motion.div>
        )}
      </motion.div>

      {/* ── Marquee ticker strip ── */}
      {ticker && ticker.length > 0 && (
        <MarqueeTicker items={ticker} duration={tickerDuration} />
      )}
    </div>
  );
}
