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
          <Card key={stat.title} className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight font-mono text-foreground">
                {stat.value}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{stat.subtext}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
