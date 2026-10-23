"use client";

import { useEffect } from "react";

export function useLiquidGlass() {
  useEffect(() => {
    let disposed = false;
    let lenses: { destroy(): void }[] = [];
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const timer = window.setTimeout(async () => {
      try {
        if (typeof window === "undefined" || disposed) return;
        if (document.fonts?.ready) {
          await document.fonts.ready;
        }
        if (disposed) return;

        const mod = await import("liquid-gl");
        const liquidGL = typeof mod.default === "function" ? mod.default : (mod as any);
        if (typeof liquidGL !== "function" || disposed) return;

        const result = liquidGL({
          target: ".liquid-nav-surface",
          snapshot: "body",
          engine: "auto",
          resolution: 0.65,
          refraction: 0.012,
          bevelDepth: 0.1,
          bevelWidth: 0.12,
          frost: 0,
          shadow: false,
          specular: true,
          tilt: false,
          interaction: "fluid",
          interactionStrength: 0.12,
          zIndex: 30,
        });
        lenses = result ? (Array.isArray(result) ? result : [result]) : [];

        const landingScope = document.querySelector(".landing-root") || document.documentElement;
        const tint = getComputedStyle(landingScope).getPropertyValue("--primary").trim() || "oklch(0.546 0.245 262.88)";

        const buttons = liquidGL({
          target: ".liquid-button-surface",
          snapshot: "body",
          content: false,
          engine: "auto",
          resolution: 0.65,
          refraction: 0.018,
          bevelDepth: 0.12,
          bevelWidth: 0.18,
          frost: 0,
          shadow: false,
          specular: true,
          tilt: false,
          interaction: "fluid",
          interactionStrength: 0.1,
          tint: `color-mix(in oklab, ${tint} 12%, transparent)`,
          zIndex: 1,
        });
        if (buttons) lenses.push(...(Array.isArray(buttons) ? buttons : [buttons]));
      } catch (err) {
        // Fallback glass styling is rendered through pure CSS backdrop-filter
      }
    }, 1200);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      lenses.forEach((lens) => lens?.destroy?.());
    };
  }, []);
}

