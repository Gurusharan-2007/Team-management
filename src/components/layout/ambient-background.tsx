"use client";

import * as React from "react";

export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Top Left: Cyan / Electric Blue Atmospheric Bloom */}
      <div className="absolute -top-[15%] -left-[10%] h-[550px] w-[550px] rounded-full bg-gradient-to-br from-cyan-500/15 via-blue-600/10 to-transparent blur-[120px] dark:from-cyan-400/20 dark:via-blue-500/12" />

      {/* Hero Center / Top Right: Ethereal Dawn / Amber Aura */}
      <div className="absolute top-[5%] left-[30%] h-[400px] w-[650px] rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-amber-500/8 blur-[140px] dark:from-indigo-600/15 dark:via-purple-500/12 dark:to-amber-400/10" />

      {/* Mid Left: Deep Cosmic Purple / Lavender Bloom */}
      <div className="absolute top-[45%] -left-[15%] h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-purple-600/15 via-indigo-600/10 to-transparent blur-[130px] dark:from-purple-600/22 dark:via-indigo-500/15" />

      {/* Bottom Right: Soft Cobalt / Violet Atmospheric Fog */}
      <div className="absolute -bottom-[10%] -right-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-blue-600/15 via-purple-600/10 to-transparent blur-[140px] dark:from-blue-600/20 dark:via-purple-600/15" />

      {/* Subtle Ambient Vignette / Grain overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_60%,hsl(var(--background)/0.65)_100%)]" />
    </div>
  );
}
