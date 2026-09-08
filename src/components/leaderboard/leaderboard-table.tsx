"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LeaderboardCategory,
  LeaderboardEntry,
  LeaderboardPeriod,
  ROLE_LABELS,
  ROLE_BADGE_VARIANTS,
} from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Zap,
  Gift,
  Info,
  HelpCircle,
  BookOpen,
  Target,
  TrendingUp,
  Award,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { AchievementIcon } from "@/components/achievements/achievement-icon";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  category: LeaderboardCategory;
  period: LeaderboardPeriod;
  onCategoryChange: (category: LeaderboardCategory) => void;
  onPeriodChange: (period: LeaderboardPeriod) => void;
}

export function LeaderboardTable({
  entries,
  currentUserId,
  category,
  period,
  onCategoryChange,
  onPeriodChange,
}: LeaderboardTableProps) {
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  // Helper for rank badge styling
  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/15 text-amber-500 font-bold text-xs border border-amber-500/30 shadow-sm">
          #1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-400/15 text-slate-300 font-bold text-xs border border-slate-400/30 shadow-sm">
          #2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/15 text-amber-600 font-bold text-xs border border-amber-700/30 shadow-sm">
          #3
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground font-medium text-xs">
        #{rank}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Category Tabs and Period Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        {/* Categories */}
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/50 text-sm">
          <button
            type="button"
            onClick={() => onCategoryChange("overall")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              category === "overall"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Overall</span>
          </button>

          <button
            type="button"
            onClick={() => onCategoryChange("activity")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              category === "activity"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="w-4 h-4 text-sky-500" />
            <span>Activity Points</span>
          </button>

          <button
            type="button"
            onClick={() => onCategoryChange("reward")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              category === "reward"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Gift className="w-4 h-4 text-emerald-500" />
            <span>Reward Points</span>
          </button>
        </div>

        {/* Period Selector & Formula Popover Trigger */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="inline-flex items-center rounded-md border border-border bg-background p-0.5 text-xs font-medium text-muted-foreground">
            <button
              type="button"
              onClick={() => onPeriodChange("all_time")}
              className={`px-2.5 py-1 rounded transition-colors ${
                period === "all_time"
                  ? "bg-muted text-foreground font-semibold"
                  : "hover:text-foreground"
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => onPeriodChange("current_week")}
              className={`px-2.5 py-1 rounded transition-colors ${
                period === "current_week"
                  ? "bg-muted text-foreground font-semibold"
                  : "hover:text-foreground"
              }`}
            >
              Current Week
            </button>
            <button
              type="button"
              onClick={() => onPeriodChange("previous_week")}
              className={`px-2.5 py-1 rounded transition-colors ${
                period === "previous_week"
                  ? "bg-muted text-foreground font-semibold"
                  : "hover:text-foreground"
              }`}
            >
              Previous Week
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowFormulaModal(true)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
            title="View Overall Scoring Formula"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase border-b border-border">
              <tr>
                <th className="px-4 py-3 w-16 text-center">Rank</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3 text-right">
                  <span
                    className={
                      category === "overall" ? "text-amber-500 font-bold" : ""
                    }
                  >
                    Overall Score
                  </span>
                </th>
                <th className="px-4 py-3 text-right">
                  <span
                    className={
                      category === "activity" ? "text-sky-500 font-bold" : ""
                    }
                  >
                    Activity Pts
                  </span>
                </th>
                <th className="px-4 py-3 text-right">
                  <span
                    className={
                      category === "reward" ? "text-emerald-500 font-bold" : ""
                    }
                  >
                    Reward Pts
                  </span>
                </th>
                <th className="px-4 py-3 hidden md:table-cell text-center">
                  Courses
                </th>
                <th className="px-4 py-3 hidden lg:table-cell text-center">
                  Milestones
                </th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    {period === "previous_week"
                      ? "No historical snapshots exist for the previous week yet."
                      : "No active team members found."}
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const isCurrent = entry.member_id === currentUserId;
                  const initials = entry.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={entry.member_id}
                      className={`group transition-colors ${
                        isCurrent
                          ? "bg-primary/[0.04] border-l-2 border-l-primary hover:bg-primary/[0.07]"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      {/* Rank */}
                      <td className="px-4 py-3.5 text-center font-medium">
                        {renderRankBadge(entry.rank)}
                      </td>

                      {/* Member Info */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 rounded-full border border-border/60">
                            {entry.avatar_url && (
                              <AvatarImage
                                src={entry.avatar_url}
                                alt={entry.full_name}
                              />
                            )}
                            <AvatarFallback className="text-[11px] font-semibold bg-muted text-muted-foreground">
                              {initials}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Link
                                href={`/profile/${entry.member_id}`}
                                className="font-semibold text-foreground hover:underline truncate"
                              >
                                {entry.full_name}
                              </Link>
                              {isCurrent && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary/15 text-primary border border-primary/20">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Badge
                                variant={ROLE_BADGE_VARIANTS[entry.role]}
                                className="text-[10px] px-1.5 py-0 font-medium"
                              >
                                {ROLE_LABELS[entry.role]}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Overall Score */}
                      <td className="px-4 py-3.5 text-right font-mono">
                        <span
                          className={`text-sm ${
                            category === "overall"
                              ? "font-bold text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {entry.overall_score.toLocaleString()}
                        </span>
                      </td>

                      {/* Activity Points */}
                      <td className="px-4 py-3.5 text-right font-mono">
                        <span
                          className={`text-sm ${
                            category === "activity"
                              ? "font-bold text-sky-500"
                              : "text-foreground font-medium"
                          }`}
                        >
                          {entry.activity_points.toLocaleString()}
                        </span>
                      </td>

                      {/* Reward Points */}
                      <td className="px-4 py-3.5 text-right font-mono">
                        <span
                          className={`text-sm ${
                            category === "reward"
                              ? "font-bold text-emerald-500"
                              : "text-foreground font-medium"
                          }`}
                        >
                          {entry.reward_points.toLocaleString()}
                        </span>
                      </td>

                      {/* Courses */}
                      <td className="px-4 py-3.5 hidden md:table-cell text-center">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                          <BookOpen className="w-3.5 h-3.5 text-muted-foreground/70" />
                          {entry.completed_courses_count}
                        </span>
                      </td>

                      {/* Milestones / Earned Achievements */}
                      <td className="px-4 py-3.5 hidden lg:table-cell text-center">
                        <div className="flex items-center justify-center gap-1">
                          {entry.earned_achievements &&
                          entry.earned_achievements.length > 0 ? (
                            entry.earned_achievements.slice(0, 3).map((ach) => (
                              <span
                                key={ach.id}
                                title={`${ach.name}: ${ach.description}`}
                                className="p-1 rounded-md bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <AchievementIcon
                                  name={ach.icon}
                                  className="w-3.5 h-3.5"
                                />
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground/50">
                              —
                            </span>
                          )}
                          {entry.earned_achievements &&
                            entry.earned_achievements.length > 3 && (
                              <span className="text-[11px] font-semibold text-muted-foreground">
                                +{entry.earned_achievements.length - 3}
                              </span>
                            )}
                        </div>
                      </td>

                      {/* Profile Link Chevron */}
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/profile/${entry.member_id}`}
                          className="text-muted-foreground/40 hover:text-foreground transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overall Performance Formula Explainer Dialog */}
      <Dialog open={showFormulaModal} onOpenChange={setShowFormulaModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Trophy className="w-5 h-5 text-amber-500" />
              Overall Performance Formula
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Deterministic, documented scoring model for team-wide performance rankings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-sm">
            <div className="p-3.5 rounded-lg bg-muted/60 border border-border font-mono text-xs leading-relaxed space-y-1">
              <div className="font-semibold text-foreground text-[13px] pb-1 border-b border-border/50">
                Score = (Act Pts × 1.0) + (Rew Pts × 2.0) + (Courses × 15.0) + (Goals × 25.0) + (max(0, Weekly Delta) × 1.5)
              </div>
              <p className="text-muted-foreground text-[11px] pt-1">
                Weights: Activity (1.0x), Reward (2.0x), Completed Courses (15.0 pts), Completed Goals (25.0 pts), Weekly Improvement (1.5x positive momentum).
              </p>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <h4 className="font-semibold text-foreground">Fallback Behavior:</h4>
              <p>
                When fewer than 2 weekly snapshots exist, the weekly improvement delta defaults to 0, evaluating scores purely on verified Activity Points, Reward Points, completed courses, and completed goals.
              </p>

              <h4 className="font-semibold text-foreground pt-1">Deterministic Tie-Breaking:</h4>
              <p>
                Rankings are guaranteed stable across reloads using secondary criteria:
                <br />
                <span className="font-mono text-[11px]">
                  Score → Activity Points → Reward Points → Full Name (A-Z) → Member ID.
                </span>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
