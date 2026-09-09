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
  currentWeekActivity = 2850,
  currentWeekReward = 1320,
}: FuturisticTrendsChartProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  const [range, setRange] = React.useState<4 | 8 | 12>(8);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fallback high-fidelity sample trends matching reference image if empty
  const defaultMockTrends: WeeklyTrendPoint[] = [
    {
      week_start: "2025-03-01",
      week_end: "2025-03-07",
      week_label: "W1",
      activity_points: 1100,
      reward_points: 500,
    },
    {
      week_start: "2025-03-08",
      week_end: "2025-03-14",
      week_label: "W2",
      activity_points: 1450,
      reward_points: 620,
    },
    {
      week_start: "2025-03-15",
      week_end: "2025-03-21",
      week_label: "W3",
      activity_points: 1700,
      reward_points: 750,
    },
    {
      week_start: "2025-03-22",
      week_end: "2025-03-28",
      week_label: "W4",
      activity_points: 1980,
      reward_points: 920,
    },
    {
      week_start: "2025-03-29",
      week_end: "2025-04-04",
      week_label: "W5",
      activity_points: 1850,
      reward_points: 880,
    },
    {
      week_start: "2025-04-05",
      week_end: "2025-04-11",
      week_label: "W6",
      activity_points: 2300,
      reward_points: 1100,
    },
    {
      week_start: "2025-04-12",
      week_end: "2025-04-18",
      week_label: "W7",
      activity_points: 2550,
      reward_points: 1180,
    },
    {
      week_start: "2025-04-19",
      week_end: "2025-04-25",
      week_label: "W8",
      activity_points: currentWeekActivity,
      reward_points: currentWeekReward,
    },
  ];

  const trendsToUse =
    initialTrends && initialTrends.length >= 3 ? initialTrends : defaultMockTrends;

  const displayedData = React.useMemo(() => {
    return trendsToUse.slice(-range).map((item, idx) => ({
      ...item,
      // Format clean W1, W2 labels if needed
      displayLabel: item.week_label.startsWith("W") ? item.week_label : `W${idx + 1}`,
    }));
  }, [trendsToUse, range]);

  return (
    <Card className="glass-panel relative overflow-hidden rounded-3xl p-6 border-border/70 shadow-glass">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h3 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
            Activity &amp; Reward Trends
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last {range} weeks performance
          </p>
        </div>

        {/* Legend Pills & Period Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
              Activity Points
            </span>
            <span className="flex items-center gap-1.5 text-purple-400">
              <span className="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.8)]" />
              Reward Points
            </span>
          </div>

          {/* Period Range Buttons */}
          <div className="flex items-center gap-1 bg-background/50 dark:bg-white/[0.04] p-1 rounded-xl border border-border/60 text-xs">
            {([4, 8, 12] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                  range === r
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}W
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart Canvas with Floating "This Week" Stats Card */}
      <div className="relative mt-4">
        {/* Floating "This Week" Stats Pill (from reference image) */}
        <div className="absolute right-3 top-2 z-10 hidden sm:flex flex-col rounded-2xl border border-white/10 bg-[#0c1428]/80 p-3 shadow-glass backdrop-blur-xl space-y-1.5 select-none">
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

        {/* Recharts Canvas */}
        <div className="h-[280px] w-full pt-2">
          {!isMounted ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              Loading visualization...
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
                        <div className="rounded-2xl border border-white/10 bg-[#0c1428]/95 p-3 shadow-glass text-xs space-y-1.5 min-w-[150px] backdrop-blur-xl">
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
    </Card>
  );
}
