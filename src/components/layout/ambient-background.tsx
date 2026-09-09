"use client";

import * as React from "react";

export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* 1. Deep Midnight Cosmic Navy Foundation */}
      <div className="absolute inset-0 bg-[#060913] bg-gradient-to-b from-[#060913] via-[#090e1f] to-[#070b16] hidden dark:block" />

      {/* 2. Left Nebula Core: Swirling Electric Blue & Deep Purple (Behind Sidebar & Middle) */}
      <div className="absolute -top-[10%] -left-[15%] h-[800px] w-[800px] rounded-full bg-gradient-to-br from-blue-600/35 via-indigo-600/25 to-purple-800/20 blur-[130px] animate-aurora-slow opacity-40 dark:opacity-100" />

      {/* 3. Center-Top Sunrise Dawn Bloom: Soft Amber & Ethereal Peach (Behind Hero Mountain) */}
      <div className="absolute top-[2%] left-[28%] h-[500px] w-[850px] rounded-full bg-gradient-to-r from-indigo-500/15 via-purple-600/20 to-amber-400/18 blur-[140px] animate-aurora-drift opacity-50 dark:opacity-100" />

      {/* 4. Mid-Left Cosmic Violet Atmospheric Fog */}
      <div className="absolute top-[40%] -left-[10%] h-[700px] w-[700px] rounded-full bg-gradient-to-tr from-purple-700/25 via-indigo-700/20 to-cyan-500/15 blur-[150px] animate-aurora-drift opacity-40 dark:opacity-100" />

      {/* 5. Bottom & Bottom-Right: Cyan & Cobalt Aurora Light River */}
      <div className="absolute -bottom-[15%] left-[20%] h-[650px] w-[950px] rounded-full bg-gradient-to-tl from-blue-600/25 via-cyan-500/20 to-purple-600/15 blur-[160px] animate-aurora-slow opacity-40 dark:opacity-100" />

      {/* 6. Subtle Cosmic Star Dust (Tiny fixed luminous pinpoints) */}
      <svg
        className="absolute inset-0 h-full w-full opacity-40 mix-blend-screen hidden dark:block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="8%" cy="14%" r="1.2" fill="#93c5fd" opacity="0.8" />
        <circle cx="18%" cy="42%" r="0.8" fill="#e0e7ff" opacity="0.6" />
        <circle cx="28%" cy="18%" r="1.5" fill="#38bdf8" opacity="0.9" />
        <circle cx="38%" cy="75%" r="1.0" fill="#c084fc" opacity="0.7" />
        <circle cx="52%" cy="22%" r="1.2" fill="#fbcfe8" opacity="0.7" />
        <circle cx="68%" cy="12%" r="1.6" fill="#fde68a" opacity="0.8" />
        <circle cx="78%" cy="65%" r="0.9" fill="#93c5fd" opacity="0.6" />
        <circle cx="88%" cy="28%" r="1.4" fill="#a78bfa" opacity="0.8" />
        <circle cx="94%" cy="85%" r="1.1" fill="#38bdf8" opacity="0.7" />
        <circle cx="12%" cy="88%" r="1.3" fill="#818cf8" opacity="0.7" />
        <circle cx="45%" cy="92%" r="0.9" fill="#38bdf8" opacity="0.5" />
      </svg>

      {/* 7. Atmosphere Light Diffusion & Subtle Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,transparent_50%,rgba(6,9,19,0.7)_100%)] hidden dark:block" />

      {/* 8. 3D Translucent Isometric Cyan Glass Cube (from reference image bottom-right) */}
      <div className="absolute -bottom-10 -right-10 pointer-events-none select-none opacity-80 mix-blend-screen hidden dark:sm:block">
        <div className="relative h-64 w-64">
          <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-3xl animate-pulse-subtle" />
          <svg
            className="h-full w-full drop-shadow-[0_0_30px_rgba(56,189,248,0.5)] transform rotate-12"
            viewBox="0 0 200 200"
            fill="none"
          >
            {/* Top Isometric Face */}
            <polygon
              points="100,25 165,62 100,100 35,62"
              fill="url(#cube-top)"
              opacity="0.85"
            />
            {/* Right Isometric Face */}
            <polygon
              points="100,100 165,62 165,138 100,175"
              fill="url(#cube-right)"
              opacity="0.75"
            />
            {/* Left Isometric Face */}
            <polygon
              points="100,100 35,62 35,138 100,175"
              fill="url(#cube-left)"
              opacity="0.9"
            />
            {/* Edge Highlights */}
            <line x1="100" y1="25" x2="100" y2="100" stroke="#a5f3fc" strokeWidth="1.5" opacity="0.8" />
            <line x1="35" y1="62" x2="100" y2="100" stroke="#a5f3fc" strokeWidth="1.5" opacity="0.7" />
            <line x1="165" y1="62" x2="100" y2="100" stroke="#38bdf8" strokeWidth="1.5" opacity="0.7" />
            <line x1="100" y1="100" x2="100" y2="175" stroke="#38bdf8" strokeWidth="2" opacity="0.9" />

            <defs>
              <linearGradient id="cube-top" x1="35" y1="25" x2="165" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="cube-right" x1="100" y1="62" x2="165" y2="175" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0369a1" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="cube-left" x1="35" y1="62" x2="100" y2="175" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.7" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}
