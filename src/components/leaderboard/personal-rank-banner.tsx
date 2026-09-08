"use client";

import React from "react";
import { PersonalRankSummary } from "@/types/domain";
import { Trophy, Zap, Gift, Award, TrendingUp } from "lucide-react";

interface PersonalRankBannerProps {
  rankSummary: PersonalRankSummary | null;
  userName?: string;
}

export function PersonalRankBanner({ rankSummary, userName }: PersonalRankBannerProps) {
  if (!rankSummary || rankSummary.total_active_members === 0) {
    return null;
  }

  const {
    overall_rank,
    activity_rank,
    reward_rank,
    total_active_members,
    overall_score,
    activity_points,
    reward_points,
  } = rankSummary;

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Overall rank hero */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Your Standing
            </div>
            <div className="text-lg font-bold text-foreground flex items-baseline gap-2">
              <span>
                {overall_rank ? `#${overall_rank}` : "Unranked"}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  of {total_active_members} active members
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Breakdown of category ranks and points */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-border">
          {/* Overall Score */}
          <div className="px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-center">
            <div className="text-[11px] text-muted-foreground font-medium flex items-center justify-center gap-1">
              <span>Score</span>
            </div>
            <div className="text-base font-bold text-foreground font-mono">
              {overall_score.toLocaleString()}
            </div>
          </div>

          {/* Activity Rank */}
          <div className="px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-center">
            <div className="text-[11px] text-muted-foreground font-medium flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-sky-500" />
              <span>Activity</span>
            </div>
            <div className="text-base font-bold text-foreground font-mono">
              {activity_rank ? `#${activity_rank}` : "—"}
            </div>
          </div>

          {/* Reward Rank */}
          <div className="px-3 py-2 rounded-lg bg-muted/30 border border-border/50 text-center">
            <div className="text-[11px] text-muted-foreground font-medium flex items-center justify-center gap-1">
              <Gift className="w-3 h-3 text-emerald-500" />
              <span>Reward</span>
            </div>
            <div className="text-base font-bold text-foreground font-mono">
              {reward_rank ? `#${reward_rank}` : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
