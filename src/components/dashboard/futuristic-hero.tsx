"use client";

import * as React from "react";
import Link from "next/link";
import { Users, Calendar, Trophy, Sparkles, ArrowRight } from "lucide-react";
import { RoleBadge } from "@/components/ui/role-badge";
import { UserRole } from "@/types/domain";
import { formatPoints } from "@/lib/utils";

interface FuturisticHeroProps {
  userName: string;
  userRole: UserRole;
  activeMemberCount: number;
  teamTotalPoints: number;
  currentRank?: number | null;
}

export function FuturisticHero({
  userName,
  userRole,
  activeMemberCount,
  teamTotalPoints,
  currentRank = 1,
}: FuturisticHeroProps) {
  // Get current hour for greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-r from-[#0c1428] via-[#131d38] to-[#241b3d] shadow-glass">
      {/* Scenic Mountain Summit Graphic & Ambient Dawn Lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 select-none overflow-hidden"
      >
        {/* Soft Dawn Sun Glow */}
        <div className="absolute -top-20 right-1/4 h-80 w-80 rounded-full bg-gradient-to-b from-amber-300/25 via-pink-500/20 to-purple-600/10 blur-3xl" />

        {/* Mountain Silhouette with Climber and Flag (SVG Art) */}
        <svg
          className="absolute right-0 bottom-0 h-full w-full max-w-[650px] opacity-75 dark:opacity-90"
          viewBox="0 0 650 260"
          fill="none"
          preserveAspectRatio="xMaxYMax meet"
        >
          <defs>
            <linearGradient id="mountain-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#312e81" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#1e1b4b" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="sky-glow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Distant Mountain Range */}
          <path
            d="M50 260 L200 130 L320 200 L440 90 L560 170 L650 110 L650 260 Z"
            fill="url(#sky-glow)"
            opacity="0.35"
          />

          {/* Foreground Rugged Summit Peak */}
          <path
            d="M240 260 L380 120 L420 140 L500 50 L560 110 L650 80 L650 260 Z"
            fill="url(#mountain-grad)"
          />

          {/* Summit Flagpole & Waving Flag */}
          <line x1="500" y1="50" x2="500" y2="25" stroke="#cbd5e1" strokeWidth="2" />
          <path
            d="M500 25 Q515 20, 528 26 Q515 32, 500 37 Z"
            fill="#a855f7"
            className="drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"
          />

          {/* Victorious Climber Silhouette on Peak */}
          <circle cx="488" cy="38" r="3.5" fill="#f8fafc" />
          <line x1="488" y1="41" x2="488" y2="48" stroke="#f8fafc" strokeWidth="2.5" />
          <line x1="488" y1="43" x2="482" y2="40" stroke="#f8fafc" strokeWidth="2" />
          <line x1="488" y1="43" x2="494" y2="41" stroke="#f8fafc" strokeWidth="2" />
          <line x1="488" y1="48" x2="484" y2="52" stroke="#f8fafc" strokeWidth="2.2" />
          <line x1="488" y1="48" x2="492" y2="52" stroke="#f8fafc" strokeWidth="2.2" />
        </svg>

        {/* Motivational Script Watermark from Reference */}
        <div className="absolute right-12 top-8 hidden lg:block text-right select-none opacity-80">
          <p className="font-serif italic text-lg tracking-wide text-indigo-200/70 drop-shadow">
            Better Teams
          </p>
          <p className="font-serif italic text-2xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-pink-200 drop-shadow">
            Bigger Dreams
          </p>
        </div>
      </div>

      {/* Hero Content Overlay (Glass Form) */}
      <div className="relative z-10 p-6 sm:p-8 space-y-5 max-w-2xl">
        <div className="space-y-1.5">
          <div className="text-xs font-medium uppercase tracking-widest text-indigo-300/90">
            {greeting},
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>{userName}</span>
              <span className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">👑</span>
            </h1>
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-purple-500/25 text-purple-200 border border-purple-400/40 shadow-[0_0_12px_rgba(168,85,247,0.35)] backdrop-blur-md capitalize">
              {userRole.replace("_", " ")}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-indigo-100/80 leading-relaxed max-w-lg pt-1">
            Keep pushing forward! Your team is making great progress. Let&apos;s achieve more together!
          </p>
        </div>

        {/* 3 Embedded Glass Stat Pills (from reference image) */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Stat 1: Active Team Members */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-xl shadow-glass">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/25 text-cyan-300 border border-cyan-400/30">
              <Users className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-base font-bold font-mono text-white leading-tight">
                {activeMemberCount}
              </div>
              <div className="text-[11px] text-indigo-200/80 font-medium">Team Members</div>
            </div>
          </div>

          {/* Stat 2: Active Days This Week */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-xl shadow-glass">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/25 text-indigo-300 border border-indigo-400/30">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-base font-bold text-white leading-tight">
                This Week
              </div>
              <div className="text-[11px] text-indigo-200/80 font-medium">Active Cycle</div>
            </div>
          </div>

          {/* Stat 3: Team Score / Standing */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 backdrop-blur-xl shadow-glass">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/25 text-amber-300 border border-amber-400/30">
              <Trophy className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-base font-bold font-mono text-white leading-tight">
                {currentRank ? `#${currentRank}` : formatPoints(teamTotalPoints)}
              </div>
              <div className="text-[11px] text-indigo-200/80 font-medium">Team Standing</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
