"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/card";
import { WeeklyTrendPoint } from "@/types/domain";
import { formatPoints } from "@/lib/utils";
import { Zap, Award } from "lucide-react";

interface FuturisticTrendsChartProps {
  initialTrends?: WeeklyTrendPoint[];
  currentWeekActivity?: number;
  currentWeekReward?: number;
}

export function FuturisticTrendsChart({
  initialTrends = [],
  currentWeekActivity = 0,
  currentWeekReward = 0,
}: FuturisticTrendsChartProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  const [range, setRange] = React.useState<4 | 8 | 12>(8);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const hasData = initialTrends && initialTrends.length > 0;

  const displayedData = React.useMemo(() => {
    if (!hasData) return [];
    return initialTrends.slice(-range).map((item, idx) => ({
      ...item,
      displayLabel: item.week_label || `W${idx + 1}`,
    }));
  }, [initialTrends, range, hasData]);

  return (
    <div className="glass-panel-dark relative overflow-hidden rounded-2xl p-5 select-none h-full flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60 dark:border-white/[0.06]">
        <div>
          <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground flex items-center gap-2">
            Activity &amp; Reward Trends
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last {range} weeks performance
          </p>
        </div>

        {/* Range & Legend Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Range Tabs */}
          <div className="cosmic-tab-container">
            <button
              type="button"
              onClick={() => setRange(4)}
              className={range === 4 ? "cosmic-tab-active !py-1 !px-2 text-[11px]" : "cosmic-tab !py-1 !px-2 text-[11px]"}
            >
              4W
            </button>
            <button
              type="button"
              onClick={() => setRange(8)}
              className={range === 8 ? "cosmic-tab-active !py-1 !px-2 text-[11px]" : "cosmic-tab !py-1 !px-2 text-[11px]"}
            >
              8W
            </button>
            <button
              type="button"
              onClick={() => setRange(12)}
              className={range === 12 ? "cosmic-tab-active !py-1 !px-2 text-[11px]" : "cosmic-tab !py-1 !px-2 text-[11px]"}
            >
              12W
            </button>
          </div>

          {/* Arrow Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setRange((prev) => (prev === 4 ? 8 : prev === 8 ? 12 : 4))}
              className="h-6 w-6 rounded-lg bg-muted/60 dark:bg-white/[0.06] border border-border/80 dark:border-white/10 flex items-center justify-center text-xs text-muted-foreground dark:text-slate-300 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/[0.12] transition-colors"
              aria-label="Previous period"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setRange((prev) => (prev === 12 ? 8 : prev === 8 ? 4 : 12))}
              className="h-6 w-6 rounded-lg bg-muted/60 dark:bg-white/[0.06] border border-border/80 dark:border-white/10 flex items-center justify-center text-xs text-muted-foreground dark:text-slate-300 hover:text-foreground dark:hover:text-white hover:bg-muted dark:hover:bg-white/[0.12] transition-colors"
              aria-label="Next period"
            >
              →
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-cyan-500 dark:text-cyan-400">
              <span className="h-2 w-2 rounded-full bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
              Activity Points
            </span>
            <span className="flex items-center gap-1.5 text-purple-500 dark:text-purple-400">
              <span className="h-2 w-2 rounded-full bg-purple-500 dark:bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.8)]" />
              Reward Points
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart Canvas with Floating "This Week" Stats Card */}
      <div className="relative mt-4">
        {/* Floating "This Week" Stats Pill (from reference image) */}
        <div className="absolute right-3 top-2 z-10 hidden sm:flex flex-col rounded-2xl border border-border/80 dark:border-white/10 bg-card/85 dark:bg-[#0c1428]/80 p-3 shadow-glass backdrop-blur-xl space-y-1.5 select-none">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            This Week
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="text-muted-foreground">Activity</span>
            <span className="font-mono font-bold text-foreground">
              {formatPoints(currentWeekActivity)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            <span className="text-muted-foreground">Reward</span>
            <span className="font-mono font-bold text-foreground">
              {formatPoints(currentWeekReward)}
            </span>
          </div>
        </div>

        {/* Recharts Canvas / Empty State */}
        <div className="h-[280px] w-full pt-2">
          {!isMounted ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              Loading visualization...
            </div>
          ) : !hasData ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2.5">
              <div className="h-10 w-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Zap className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">No Weekly Trends Yet</p>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                Team performance trends and weekly trajectory analytics will appear here once weekly reports are finalized.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={displayedData}
                margin={{ top: 15, right: 20, left: -20, bottom: 0 }}
              >
                <defs>
                  {/* Cyan Glowing Area Gradient for Activity */}
                  <linearGradient id="areaCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="60%" stopColor="#38bdf8" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>

                  {/* Purple Glowing Area Gradient for Reward */}
                  <linearGradient id="areaPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity={0.35} />
                    <stop offset="60%" stopColor="#c084fc" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/40"
                  vertical={false}
                />

                <XAxis
                  dataKey="displayLabel"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))", opacity: 0.5 }}
                />

                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val >= 1000 ? `${val / 1000}K` : val}`}
                />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-2xl border border-border/70 dark:border-white/10 bg-card/95 dark:bg-[#0c1428]/95 p-3 shadow-glass text-xs space-y-1.5 min-w-[150px] backdrop-blur-xl">
                          <p className="font-semibold text-foreground">{label}</p>
                          {payload.map((entry: any) => (
                            <div
                              key={entry.name}
                              className="flex items-center justify-between gap-3 text-[11px]"
                            >
                              <span
                                className="flex items-center gap-1.5 font-medium"
                                style={{ color: entry.color }}
                              >
                                {entry.name === "Activity Points" ? (
                                  <Zap className="h-3 w-3" />
                                ) : (
                                  <Award className="h-3 w-3" />
                                )}
                                {entry.name}
                              </span>
                              <span className="font-mono font-bold text-foreground">
                                {formatPoints(entry.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Cyan Activity Curve */}
                <Area
                  type="monotone"
                  dataKey="activity_points"
                  name="Activity Points"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  fill="url(#areaCyan)"
                  dot={{ r: 3, fill: "#38bdf8", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#ffffff", stroke: "#38bdf8", strokeWidth: 2 }}
                />

                {/* Magenta/Purple Reward Curve */}
                <Area
                  type="monotone"
                  dataKey="reward_points"
                  name="Reward Points"
                  stroke="#c084fc"
                  strokeWidth={3}
                  fill="url(#areaPurple)"
                  dot={{ r: 3, fill: "#c084fc", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#ffffff", stroke: "#c084fc", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
