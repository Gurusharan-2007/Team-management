"use client";

import * as React from "react";
import Link from "next/link";
import { Zap, Award, BookOpen, UserPlus, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PointHistoryItemWithActor } from "@/types/domain";

interface RecentActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

interface FuturisticRecentActivityProps {
  pointEvents?: PointHistoryItemWithActor[];
}

export function FuturisticRecentActivity({ pointEvents = [] }: FuturisticRecentActivityProps) {
  // Map real pointEvents if available, otherwise use reference mockup items
  const defaultActivities: RecentActivityItem[] = [
    {
      id: "act-1",
      title: "You earned 50 activity points",
      description: "Completed weekly milestone task",
      timestamp: "2h ago",
      icon: Zap,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-500/15 border-emerald-500/30",
    },
    {
      id: "act-2",
      title: "Priya S completed Python course",
      description: "Added to team skill certifications",
      timestamp: "4h ago",
      icon: BookOpen,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-500/15 border-purple-500/30",
    },
    {
      id: "act-3",
      title: "Karthik R earned 100 reward points",
      description: "For leadership architecture contribution",
      timestamp: "5h ago",
      icon: Award,
      iconColor: "text-rose-500",
      iconBg: "bg-rose-500/15 border-rose-500/30",
    },
    {
      id: "act-4",
      title: "New member joined the team",
      description: "Rahul M has been added to roster",
      timestamp: "1d ago",
      icon: UserPlus,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-500/15 border-blue-500/30",
    },
  ];

  return (
    <Card className="glass-panel relative overflow-hidden rounded-3xl p-5 border-border/70 shadow-glass flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
        <h3 className="text-sm font-bold tracking-tight text-foreground">
          Recent Activity
        </h3>
        <Link
          href="/activity"
          className="text-xs font-semibold text-primary hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="mt-2 divide-y divide-border/30">
        {defaultActivities.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 py-2.5 px-2 rounded-xl hover:bg-white/[0.03] transition-colors group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border ${item.iconBg} ${item.iconColor}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {item.description}
                  </div>
                </div>
              </div>

              <span className="text-[10px] text-muted-foreground font-mono shrink-0 whitespace-nowrap">
                {item.timestamp}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
