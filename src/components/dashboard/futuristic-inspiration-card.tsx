"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function FuturisticInspirationCard() {
  return (
    <div className="glass-panel-dark relative overflow-hidden rounded-2xl p-5 select-none flex items-center gap-4 h-full w-full">
      {/* 3D Geometric Glowing Crystal Prism (SVG Art from Reference) */}
      <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center">
        {/* Ambient Glow */}
        <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl animate-pulse-subtle pointer-events-none" />

        {/* Faceted Crystal SVG */}
        <svg
          className="h-13 w-13 sm:h-16 sm:w-16 drop-shadow-[0_0_14px_rgba(56,189,248,0.7)] transition-transform duration-300 hover:scale-105"
          viewBox="0 0 64 64"
          fill="none"
        >
          {/* Top Facet */}
          <polygon points="32,6 48,22 32,26 16,22" fill="#67e8f9" opacity="0.9" />
          {/* Front Left Facet */}
          <polygon points="16,22 32,26 32,58 12,40" fill="#38bdf8" opacity="0.85" />
          {/* Front Right Facet */}
          <polygon points="32,26 48,22 52,40 32,58" fill="#818cf8" opacity="0.95" />
          {/* Bottom Tip Glow */}
          <polygon points="32,26 32,58 26,44" fill="#c084fc" opacity="0.8" />
          {/* Highlight Sparkle */}
          <circle cx="32" cy="26" r="2" fill="#ffffff" />
        </svg>
      </div>

      {/* Content & View Leaderboard Action Stack */}
      <div className="flex-1 min-w-0 flex flex-col items-start justify-center space-y-1">
        <h4 className="text-xs sm:text-sm font-bold tracking-tight text-foreground leading-snug">
          Your progress inspires the team!
        </h4>
        <p className="text-[11px] text-muted-foreground leading-normal">
          Keep going, you&apos;re doing great.
        </p>
        <div className="pt-2">
          <Button
            asChild
            size="sm"
            className="h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-xs font-semibold shadow-[0_0_15px_rgba(37,99,235,0.35)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] px-4 text-white group border border-blue-400/30 transition-all duration-200"
          >
            <Link href="/leaderboard" className="inline-flex items-center gap-1.5">
              <span>View Leaderboard</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
