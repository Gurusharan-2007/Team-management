"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyTrendPoint } from "@/types/domain";
import { TrendingUp, Zap, Award } from "lucide-react";
import { formatPoints } from "@/lib/utils";

interface IndividualTrendChartProps {
  initialTrends: WeeklyTrendPoint[];
  memberName?: string;
  title?: string;
  description?: string;
}

export function IndividualTrendChart({
  initialTrends,
  memberName,
  title = "My Historical Performance Trend",
  description = "Weekly snapshot progression over reporting periods",
}: IndividualTrendChartProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  const [range, setRange] = React.useState<4 | 8 | 12>(8);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const displayedData = React.useMemo(() => {
    return initialTrends.slice(-range);
  }, [initialTrends, range]);

  if (!isMounted) {
    return (
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent className="h-[260px] flex items-center justify-center text-xs text-muted-foreground">
          Loading trend visualization...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {memberName ? `${memberName}'s Trends` : title}
            </CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>

          <div className="cosmic-tab-container self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setRange(4)}
              className={range === 4 ? "cosmic-tab-active" : "cosmic-tab"}
            >
              4 Wks
            </button>
            <button
              type="button"
              onClick={() => setRange(8)}
              className={range === 8 ? "cosmic-tab-active" : "cosmic-tab"}
            >
              8 Wks
            </button>
            <button
              type="button"
              onClick={() => setRange(12)}
              className={range === 12 ? "cosmic-tab-active" : "cosmic-tab"}
            >
              12 Wks
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {displayedData.length === 0 ? (
          <div className="h-[240px] flex items-center justify-center text-xs text-muted-foreground">
            No historical weekly records for this member yet.
          </div>
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={displayedData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
                <XAxis
                  dataKey="week_label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => formatPoints(val)}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border border-border bg-background p-2.5 shadow-md text-xs space-y-1.5 min-w-[140px]">
                          <p className="font-semibold text-foreground">{label}</p>
                          {payload.map((entry: any) => (
                            <div
                              key={entry.name}
                              className="flex items-center justify-between gap-3 text-[11px]"
                            >
                              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                                {entry.name === "Activity Points" ? (
                                  <Zap className="h-3 w-3 text-amber-500" />
                                ) : (
                                  <Award className="h-3 w-3 text-purple-500" />
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
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs text-muted-foreground mr-4">{value}</span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="activity_points"
                  name="Activity Points"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="reward_points"
                  name="Reward Points"
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#a855f7", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
