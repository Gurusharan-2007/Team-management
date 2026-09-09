"use client";

import * as React from "react";
import Link from "next/link";
import { Award, Compass, HeartHandshake, Zap, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AchievementWithStatus } from "@/types/domain";

interface FuturisticAchievementsTileProps {
  achievements?: AchievementWithStatus[];
}

export function FuturisticAchievementsTile({ achievements = [] }: FuturisticAchievementsTileProps) {
  const defaultMilestones = [
    {
      id: "ach-1",
      name: "Course Explorer",
      description: "Completed 5 courses",
      icon: Compass,
      color: "text-amber-500",
      bg: "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30",
      glow: "hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]",
    },
    {
      id: "ach-2",
      name: "Team Player",
      description: "Helped 5 teammates",
      icon: HeartHandshake,
      color: "text-purple-500",
      bg: "bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/30",
      glow: "hover:shadow-[0_0_15px_rgba(192,132,252,0.2)]",
    },
    {
      id: "ach-3",
      name: "Consistent Performer",
      description: "Active for 4 weeks",
      icon: Zap,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30",
      glow: "hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]",
    },
    {
      id: "ach-4",
      name: "Top Contributor",
      description: "Ranked in top 5",
      icon: Trophy,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10 dark:bg-cyan-500/20 border-cyan-500/30",
      glow: "hover:shadow-[0_0_15px_rgba(56,189,248,0.2)]",
    },
  ];

  return (
    <Card className="glass-panel relative overflow-hidden rounded-3xl p-5 border-border/70 shadow-glass flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
        <h3 className="text-sm font-bold tracking-tight text-foreground">
          Achievements
        </h3>
        <Link
          href="/leaderboard"
          className="text-xs font-semibold text-primary hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 flex-1">
        {defaultMilestones.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              className={`group flex flex-col items-center justify-center p-3.5 rounded-2xl border border-border/60 bg-card/40 dark:bg-white/[0.02] text-center transition-all duration-200 hover:-translate-y-0.5 ${m.glow}`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${m.bg} ${m.color} transition-transform duration-200 group-hover:scale-105 shadow-xs`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="mt-2.5 space-y-0.5">
                <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                  {m.name}
                </div>
                <div className="text-[11px] text-muted-foreground leading-tight">
                  {m.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
