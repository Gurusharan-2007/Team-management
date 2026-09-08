import * as React from "react";
import { Zap, Award, CheckCircle2, BookOpen, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPoints } from "@/lib/utils";

interface ReportSummaryHeaderProps {
  totalActivityPoints: number;
  activityGrowthPct?: number | null;
  totalRewardPoints: number;
  rewardGrowthPct?: number | null;
  updatedMembers: number;
  totalActiveMembers: number;
  coursesCompleted: number;
}

export function ReportSummaryHeader({
  totalActivityPoints,
  activityGrowthPct,
  totalRewardPoints,
  rewardGrowthPct,
  updatedMembers,
  totalActiveMembers,
  coursesCompleted,
}: ReportSummaryHeaderProps) {
  const isFirstWeek = activityGrowthPct === null && rewardGrowthPct === null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {/* Activity Points */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Activity Points
            </span>
            {activityGrowthPct !== null && activityGrowthPct !== undefined ? (
              <Badge
                variant={activityGrowthPct >= 0 ? "success" : "destructive"}
                className="text-[10px] px-1.5 py-0 gap-0.5"
              >
                {activityGrowthPct >= 0 ? (
                  <ArrowUpRight className="h-2.5 w-2.5" />
                ) : (
                  <ArrowDownRight className="h-2.5 w-2.5" />
                )}
                {activityGrowthPct >= 0 ? "+" : ""}
                {activityGrowthPct}%
              </Badge>
            ) : (
              <span className="text-[10px] text-muted-foreground">First week</span>
            )}
          </div>
          <div className="text-xl font-bold font-mono text-foreground">
            {formatPoints(totalActivityPoints)}
          </div>
          <p className="text-[11px] text-muted-foreground">Team activity total</p>
        </CardContent>
      </Card>

      {/* Reward Points */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-purple-500" />
              Reward Points
            </span>
            {rewardGrowthPct !== null && rewardGrowthPct !== undefined ? (
              <Badge
                variant={rewardGrowthPct >= 0 ? "success" : "destructive"}
                className="text-[10px] px-1.5 py-0 gap-0.5"
              >
                {rewardGrowthPct >= 0 ? (
                  <ArrowUpRight className="h-2.5 w-2.5" />
                ) : (
                  <ArrowDownRight className="h-2.5 w-2.5" />
                )}
                {rewardGrowthPct >= 0 ? "+" : ""}
                {rewardGrowthPct}%
              </Badge>
            ) : (
              <span className="text-[10px] text-muted-foreground">First week</span>
            )}
          </div>
          <div className="text-xl font-bold font-mono text-foreground">
            {formatPoints(totalRewardPoints)}
          </div>
          <p className="text-[11px] text-muted-foreground">Leadership honors</p>
        </CardContent>
      </Card>

      {/* Members Updated */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Members Updated
            </span>
            <span className="text-[10px] font-mono font-semibold text-muted-foreground">
              {totalActiveMembers > 0
                ? `${Math.round((updatedMembers / totalActiveMembers) * 100)}%`
                : "0%"}
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-foreground">
            {updatedMembers} / {totalActiveMembers}
          </div>
          <p className="text-[11px] text-muted-foreground">Saturday check-in status</p>
        </CardContent>
      </Card>

      {/* Courses Completed */}
      <Card className="border-border">
        <CardContent className="p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-blue-500" />
              Courses Verified
            </span>
            <Badge variant="subtle" className="text-[10px] px-1.5 py-0">
              Technical
            </Badge>
          </div>
          <div className="text-xl font-bold font-mono text-foreground">
            {coursesCompleted}
          </div>
          <p className="text-[11px] text-muted-foreground">Active completions</p>
        </CardContent>
      </Card>
    </div>
  );
}
