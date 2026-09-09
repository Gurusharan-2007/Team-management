"use client";

import * as React from "react";
import Link from "next/link";
import { Trophy, Zap, Award, Medal, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/role-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/types/domain";
import { formatPoints } from "@/lib/utils";

export interface PerformerMember {
  id: string;
  full_name: string;
  email?: string;
  avatar_url?: string | null;
  role: UserRole;
  activity_points: number;
  reward_points: number;
  status: string;
}

interface TopPerformersCardProps {
  members: PerformerMember[];
  title?: string;
  description?: string;
  limit?: number;
  compact?: boolean;
}

export function TopPerformersCard({
  members,
  title = "Top Performers",
  description = "Rankings of active team members based on verified points",
  limit = 5,
  compact = false,
}: TopPerformersCardProps) {
  const [metric, setMetric] = React.useState<"activity" | "reward">("activity");

  // Only consider active members for top performers
  const activeMembers = members.filter((m) => m.status === "active");

  const sortedMembers = [...activeMembers].sort((a, b) => {
    if (metric === "activity") {
      return (b.activity_points || 0) - (a.activity_points || 0);
    }
    return (b.reward_points || 0) - (a.reward_points || 0);
  }).slice(0, limit);

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function getRankBadge(index: number) {
    if (index === 0) {
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-xs font-mono border border-amber-500/30 shadow-xs">
          1
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-300/25 text-slate-700 dark:text-slate-200 font-bold text-xs font-mono border border-slate-400/30 shadow-xs">
          2
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-700/15 text-amber-700 dark:text-amber-400 font-bold text-xs font-mono border border-amber-700/30 shadow-xs">
          3
        </span>
      );
    }
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted/60 text-muted-foreground font-medium text-xs font-mono">
        {index + 1}
      </span>
    );
  }

  return (
    <Card className="border-border/70 flex flex-col justify-between shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              {title}
            </CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>

          <div className="flex items-center gap-1 bg-muted/70 p-1 rounded-lg self-start sm:self-auto border border-border/50">
            <button
              type="button"
              onClick={() => setMetric("activity")}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                metric === "activity"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Zap className="h-3 w-3 text-amber-500" />
              Activity
            </button>
            <button
              type="button"
              onClick={() => setMetric("reward")}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                metric === "reward"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Award className="h-3 w-3 text-purple-500" />
              Reward
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {sortedMembers.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No active members found with points.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {sortedMembers.map((member, index) => {
              const points =
                metric === "activity"
                  ? member.activity_points || 0
                  : member.reward_points || 0;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getRankBadge(index)}
                    <Avatar className="h-8 w-8 border border-border/60">
                      {member.avatar_url && (
                        <AvatarImage src={member.avatar_url} alt={member.full_name} />
                      )}
                      <AvatarFallback className="text-[11px] font-semibold bg-muted">
                        {getInitials(member.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/profile/${member.id}`}
                          className="text-xs font-semibold text-foreground hover:underline truncate"
                        >
                          {member.full_name}
                        </Link>
                        <RoleBadge role={member.role} size="sm" />
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {member.email}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-xs font-bold text-foreground flex items-center justify-end gap-1">
                      {metric === "activity" ? (
                        <Zap className="h-3 w-3 text-amber-500" />
                      ) : (
                        <Award className="h-3 w-3 text-purple-500" />
                      )}
                      {formatPoints(points)} pts
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {metric === "activity" ? "Activity" : "Reward"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!compact && (
          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">All active team rankings</span>
            <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
              <Link href="/leaderboard" className="flex items-center gap-1">
                Full Leaderboard
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
