"use client";

import * as React from "react";
import Link from "next/link";
import { Award, Compass, HeartHandshake, Zap, Trophy, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AchievementWithStatus } from "@/types/domain";

interface FuturisticAchievementsTileProps {
  achievements?: AchievementWithStatus[];
}

export function FuturisticAchievementsTile({ achievements = [] }: FuturisticAchievementsTileProps) {
  const displayAchievements = achievements.slice(0, 4);

  const getIcon = (iconName: string, index: number) => {
    switch (iconName?.toLowerCase()) {
      case "compass":
      case "course":
      case "book":
        return Compass;
      case "heart":
      case "team":
      case "user":
        return HeartHandshake;
      case "zap":
      case "activity":
      case "flame":
        return Zap;
      case "trophy":
      case "rank":
      case "crown":
        return Trophy;
      default:
        return [Compass, HeartHandshake, Zap, Trophy][index % 4] || Award;
    }
  };

  const colors = [
    {
      color: "text-amber-400",
      bg: "bg-amber-500/15 border-amber-500/30",
      glow: "hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]",
    },
    {
      color: "text-purple-400",
      bg: "bg-purple-500/15 border-purple-500/30",
      glow: "hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]",
    },
    {
      color: "text-emerald-400",
      bg: "bg-emerald-500/15 border-emerald-500/30",
      glow: "hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]",
    },
    {
      color: "text-sky-400",
      bg: "bg-sky-500/15 border-sky-500/30",
      glow: "hover:shadow-[0_0_15px_rgba(56,189,248,0.2)]",
    },
  ];

  return (
    <div className="glass-panel-dark relative overflow-hidden rounded-2xl p-5 select-none flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-3 border-b border-border/60 dark:border-white/[0.06]">
        <h3 className="text-sm font-bold tracking-tight text-foreground dark:text-white">
          Achievements
        </h3>
        <Link
          href="/leaderboard"
          className="text-xs font-semibold text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="mt-3 flex-1 flex flex-col justify-center">
        {displayAchievements.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-2">
            <div className="h-9 w-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Award className="h-4.5 w-4.5" />
            </div>
            <p className="text-xs font-semibold text-foreground dark:text-white">No Milestones Yet</p>
            <p className="text-[11px] text-muted-foreground dark:text-slate-400 max-w-[200px] leading-relaxed">
              Verified achievements and badges will appear as milestones are unlocked.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {displayAchievements.map((m, idx) => {
              const Icon = getIcon(m.icon, idx);
              const palette = colors[idx % colors.length];
              const isUnlocked = m.is_earned;

              return (
                <div
                  key={m.id}
                  className={`group relative flex flex-col items-center justify-center p-3 rounded-xl border border-border/70 bg-card/60 hover:bg-accent/40 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.07] hover:border-primary/40 dark:hover:border-cyan-400/30 text-center transition-all duration-200 ${
                    isUnlocked
                      ? `hover:-translate-y-0.5 ${palette.glow}`
                      : "opacity-60 grayscale"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border ${palette.bg} ${palette.color} transition-transform duration-200 group-hover:scale-105`}
                  >
                    <Icon className="h-4.5 w-4.5 stroke-[2.2]" />
                  </div>

                  {!isUnlocked && (
                    <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-muted dark:bg-white/[0.1] text-muted-foreground dark:text-slate-400">
                      <Lock className="h-2.5 w-2.5" />
                    </span>
                  )}

                  <div className="mt-2 space-y-0.5 w-full">
                    <div className="text-xs font-bold text-foreground dark:text-white truncate group-hover:text-primary dark:group-hover:text-blue-300 transition-colors leading-tight">
                      {m.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground dark:text-slate-400 truncate leading-tight">
                      {m.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
