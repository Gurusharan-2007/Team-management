"use client";

import * as React from "react";
import Link from "next/link";
import { Zap, Award, Compass, HeartHandshake, Trophy, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PointHistoryItemWithActor, AchievementWithStatus } from "@/types/domain";

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
  achievements?: AchievementWithStatus[];
}

function formatRelativeTime(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return "";
  }
}

export function FuturisticRecentActivity({
  pointEvents = [],
  achievements = [],
}: FuturisticRecentActivityProps) {
  const [activeTab, setActiveTab] = React.useState<"activity" | "achievements">("activity");

  const activities = React.useMemo(() => {
    return pointEvents.slice(0, 5).map((pe) => {
      const isReward = pe.point_type === "reward";
      const actorName = pe.actor?.full_name || "Team Member";
      const actionTitle = `${actorName} ${pe.change_amount >= 0 ? "earned" : "adjusted"} ${Math.abs(pe.change_amount)} ${pe.point_type} points`;

      return {
        id: pe.id,
        title: actionTitle,
        description: pe.reason || `${pe.point_type === "activity" ? "Sprint activity" : "Leadership honor"} update`,
        timestamp: formatRelativeTime(pe.created_at),
        icon: isReward ? Award : Zap,
        iconColor: isReward ? "text-purple-400" : "text-emerald-400",
        iconBg: isReward ? "bg-purple-500/15 border-purple-500/30 text-purple-400" : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
      };
    });
  }, [pointEvents]);

  const displayAchievements = achievements.slice(0, 4);

  const getAchievementIcon = (iconName: string, index: number) => {
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

  const achievementColors = [
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
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60 dark:border-white/[0.06]">
        <div className="cosmic-tab-container">
          <button
            type="button"
            onClick={() => setActiveTab("activity")}
            className={`cosmic-tab ${activeTab === "activity" ? "cosmic-tab-active" : ""}`}
          >
            <Zap className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Recent Activity</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("achievements")}
            className={`cosmic-tab ${activeTab === "achievements" ? "cosmic-tab-active" : ""}`}
          >
            <Award className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>Milestones</span>
          </button>
        </div>

        <Link
          href={activeTab === "activity" ? "/activity" : "/leaderboard"}
          className="text-xs font-semibold text-blue-500 dark:text-blue-400 hover:underline transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="mt-3 flex-1 flex flex-col justify-center">
        {activeTab === "activity" ? (
          <div className="divide-y divide-border/40 dark:divide-white/[0.04]">
            {activities.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-center space-y-2">
                <div className="h-9 w-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Zap className="h-4.5 w-4.5" />
                </div>
                <p className="text-xs font-semibold text-foreground">No Activity Yet</p>
                <p className="text-[11px] text-muted-foreground max-w-[240px] leading-relaxed">
                  Your team&apos;s performance data and point logs will appear here.
                </p>
              </div>
            ) : (
              activities.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 py-2 px-1.5 rounded-xl hover:bg-muted/40 dark:hover:bg-white/[0.05] transition-all group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border ${item.iconBg}`}
                      >
                        <Icon className="h-3.5 w-3.5 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary dark:group-hover:text-blue-300 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {item.description}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] text-muted-foreground font-mono shrink-0 whitespace-nowrap pt-0.5">
                      {item.timestamp}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div>
            {displayAchievements.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-center space-y-2">
                <div className="h-9 w-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Award className="h-4.5 w-4.5" />
                </div>
                <p className="text-xs font-semibold text-foreground">No Milestones Yet</p>
                <p className="text-[11px] text-muted-foreground max-w-[240px] leading-relaxed">
                  Verified achievements and badges will appear as milestones are unlocked.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {displayAchievements.map((m, idx) => {
                  const Icon = getAchievementIcon(m.icon, idx);
                  const palette = achievementColors[idx % achievementColors.length];
                  const isUnlocked = m.is_earned;

                  return (
                    <div
                      key={m.id}
                      className={`group relative flex flex-col items-center justify-center p-3 rounded-xl border border-border/60 dark:border-white/10 bg-card/40 dark:bg-white/[0.03] hover:bg-muted/50 dark:hover:bg-white/[0.07] hover:border-primary/40 dark:hover:border-cyan-400/30 text-center transition-all duration-200 ${
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
                        <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-muted/60 dark:bg-white/[0.1] text-muted-foreground">
                          <Lock className="h-2.5 w-2.5" />
                        </span>
                      )}

                      <div className="mt-2 space-y-0.5 w-full">
                        <div className="text-xs font-bold text-foreground dark:text-white truncate group-hover:text-primary dark:group-hover:text-blue-300 transition-colors leading-tight">
                          {m.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate leading-tight">
                          {m.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
