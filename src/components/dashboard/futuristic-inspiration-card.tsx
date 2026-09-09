"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function FuturisticInspirationCard() {
  return (
    <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#0d152c] via-[#161c38] to-[#1e1736] p-5 shadow-glass flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* 3D Geometric Glowing Crystal Prism (SVG Art from Reference) */}
      <div className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          {/* Ambient Glow */}
          <div className="absolute inset-0 rounded-full bg-cyan-500/25 blur-xl animate-pulse-subtle" />

          {/* Faceted Crystal SVG */}
          <svg
            className="h-14 w-14 drop-shadow-[0_0_12px_rgba(56,189,248,0.7)] transition-transform duration-300 hover:scale-105"
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

        <div className="space-y-0.5 text-center sm:text-left">
          <h4 className="text-sm font-bold tracking-tight text-white flex items-center justify-center sm:justify-start gap-1.5">
            <span>Your progress inspires the team!</span>
          </h4>
          <p className="text-xs text-indigo-200/70">
            Keep going, you&apos;re doing great.
          </p>
        </div>
      </div>

      <Button
        asChild
        size="sm"
        className="rounded-xl bg-primary/90 hover:bg-primary text-xs font-semibold shadow-glow px-4 py-2 text-white shrink-0 group"
      >
        <Link href="/leaderboard" className="flex items-center gap-1.5">
          <span>View Leaderboard</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </Button>
    </Card>
  );
}
