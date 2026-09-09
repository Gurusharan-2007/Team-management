import * as React from "react";
import { Users, Zap, Award, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPoints } from "@/lib/utils";

interface OverviewStatsProps {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  totalActivityPoints: number;
  totalRewardPoints: number;
  coursesCompleted: number;
}

export function OverviewStats({
  totalMembers,
  activeMembers,
  inactiveMembers,
  totalActivityPoints,
  totalRewardPoints,
  coursesCompleted,
}: OverviewStatsProps) {
  const stats = [
    {
      title: "Total Members",
      value: totalMembers,
      subtext: `${activeMembers} active · ${inactiveMembers} inactive`,
      icon: Users,
      iconColor: "text-muted-foreground",
    },
    {
      title: "Total Activity Points",
      value: formatPoints(totalActivityPoints),
      subtext: "Aggregated from active members",
      icon: Zap,
      iconColor: "text-amber-500",
    },
    {
      title: "Total Reward Points",
      value: formatPoints(totalRewardPoints),
      subtext: "Aggregated honors & awards",
      icon: Award,
      iconColor: "text-purple-500",
    },
    {
      title: "Courses Completed",
      value: coursesCompleted,
      subtext: "Verified technical completions",
      icon: BookOpen,
      iconColor: "text-blue-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.title}
            className="rounded-xl border border-border/70 bg-card/80 p-4 sm:p-5 shadow-xs transition-all duration-200 hover:border-border hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-muted/40 shrink-0">
                <Icon className={`h-3.5 w-3.5 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight font-mono text-foreground">
                {stat.value}
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed truncate">
                {stat.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
