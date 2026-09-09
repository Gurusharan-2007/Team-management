"use client";

import * as React from "react";
import { Zap, Award, BookOpen, Trophy, TrendingUp, MoreHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatPoints } from "@/lib/utils";

interface FuturisticMetricCardsProps {
  activityPoints: number;
  activityGrowthPct?: number | null;
  rewardPoints: number;
  rewardGrowthPct?: number | null;
  coursesCompleted: number;
  currentRank?: number | null;
}

export function FuturisticMetricCards({
  activityPoints = 2850,
  activityGrowthPct = 12,
  rewardPoints = 1320,
  rewardGrowthPct = 8,
  coursesCompleted = 8,
  currentRank = 3,
}: FuturisticMetricCardsProps) {
  const cards = [
    {
      title: "Activity Points",
      value: formatPoints(activityPoints),
      trend: `↑ ${activityGrowthPct ?? 12}%`,
      trendLabel: "vs last week",
      icon: Zap,
      accentColor: "emerald",
      badgeBg: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 border-emerald-500/30",
      trendColor: "text-emerald-500",
      curvePath: "M0 22 Q 25 18, 50 12 T 75 8 T 100 2",
      curveColor: "#10b981",
      areaGradientId: "grad-activity",
      glowColor: "rgba(16, 185, 129, 0.4)",
    },
    {
      title: "Reward Points",
      value: formatPoints(rewardPoints),
      trend: `↑ ${rewardGrowthPct ?? 8}%`,
      trendLabel: "vs last week",
      icon: Award,
      accentColor: "purple",
      badgeBg: "bg-purple-500/10 text-purple-500 dark:bg-purple-500/20 border-purple-500/30",
      trendColor: "text-purple-500",
      curvePath: "M0 24 Q 25 20, 50 14 T 75 10 T 100 3",
      curveColor: "#c084fc",
      areaGradientId: "grad-reward",
      glowColor: "rgba(192, 132, 252, 0.4)",
    },
    {
      title: "Technical Courses",
      value: String(coursesCompleted),
      trend: "↑ 2",
      trendLabel: "vs last month",
      icon: BookOpen,
      accentColor: "blue",
      badgeBg: "bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 border-blue-500/30",
      trendColor: "text-blue-500",
      curvePath: "M0 20 Q 25 16, 50 10 T 75 14 T 100 4",
      curveColor: "#38bdf8",
      areaGradientId: "grad-courses",
      glowColor: "rgba(56, 189, 248, 0.4)",
    },
    {
      title: "Current Rank",
      value: currentRank ? `#${currentRank}` : "#1",
      trend: "↑ 1",
      trendLabel: "from last week",
      icon: Trophy,
      accentColor: "amber",
      badgeBg: "bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 border-amber-500/30",
      trendColor: "text-amber-500",
      curvePath: "M0 24 Q 25 14, 50 18 T 75 8 T 100 3",
      curveColor: "#fbbf24",
      areaGradientId: "grad-rank",
      glowColor: "rgba(251, 191, 36, 0.4)",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className="glass-card relative overflow-hidden rounded-2xl p-5 border-border/70 hover:shadow-glass-hover"
          >
            {/* Header: Icon + Title + Dots */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Hexagon icon badge */}
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl border ${card.badgeBg} shadow-xs`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {card.title}
                </span>
              </div>
              <button
                type="button"
                className="text-muted-foreground/50 hover:text-foreground transition-colors p-1"
                aria-label="Card options"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Main Value & Trend Row */}
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground">
                  {card.value}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs">
                  <span className={`font-semibold font-mono ${card.trendColor}`}>
                    {card.trend}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {card.trendLabel}
                  </span>
                </div>
              </div>

              {/* Mini Sparkline SVG Curve (from reference image) */}
              <div className="w-24 h-10 select-none pointer-events-none">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 100 28"
                  fill="none"
                >
                  <defs>
                    <linearGradient
                      id={card.areaGradientId}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={card.curveColor} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={card.curveColor} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Area fill underneath curve */}
                  <path
                    d={`${card.curvePath} L 100 28 L 0 28 Z`}
                    fill={`url(#${card.areaGradientId})`}
                  />
                  {/* Glowing Stroke Curve */}
                  <path
                    d={card.curvePath}
                    stroke={card.curveColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{
                      filter: `drop-shadow(0 0 6px ${card.glowColor})`,
                    }}
                  />
                  {/* End node dot */}
                  <circle cx="100" cy="3" r="2.5" fill={card.curveColor} />
                </svg>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
