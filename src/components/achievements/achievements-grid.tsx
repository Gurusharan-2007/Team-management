"use client";

import React, { useState } from "react";
import { AchievementWithStatus } from "@/types/domain";
import { AchievementIcon } from "./achievement-icon";
import { CheckCircle2, Lock, Sparkles } from "lucide-react";

interface AchievementsGridProps {
  achievements: AchievementWithStatus[];
  emptyMessage?: string;
  showFilters?: boolean;
}

export function AchievementsGrid({
  achievements,
  emptyMessage = "No achievements to display.",
  showFilters = true,
}: AchievementsGridProps) {
  const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");

  const filteredList = achievements.filter((ach) => {
    if (filter === "earned") return ach.is_earned;
    if (filter === "locked") return !ach.is_earned;
    return true;
  });

  const earnedCount = achievements.filter((a) => a.is_earned).length;

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            Unlocked <strong className="text-foreground">{earnedCount}</strong> of {achievements.length} Milestones
          </div>

          <div className="cosmic-tab-container">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={filter === "all" ? "cosmic-tab-active" : "cosmic-tab"}
            >
              All ({achievements.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("earned")}
              className={filter === "earned" ? "cosmic-tab-active" : "cosmic-tab"}
            >
              Earned ({earnedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("locked")}
              className={filter === "locked" ? "cosmic-tab-active" : "cosmic-tab"}
            >
              In Progress ({achievements.length - earnedCount})
            </button>
          </div>
        </div>
      )}

      {filteredList.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-border rounded-xl text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredList.map((ach) => {
            const formattedDate = ach.awarded_at
              ? new Date(ach.awarded_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : null;

            return (
              <div
                key={ach.id}
                className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all ${
                  ach.is_earned
                    ? "bg-card border-border shadow-sm hover:border-primary/40"
                    : "bg-muted/20 border-border/60 opacity-80"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div
                      className={`p-2.5 rounded-lg border ${
                        ach.is_earned
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-muted text-muted-foreground border-border/50"
                      }`}
                    >
                      <AchievementIcon name={ach.icon} className="w-5 h-5" />
                    </div>

                    {ach.is_earned ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border">
                        <Lock className="w-3 h-3" />
                        Locked
                      </span>
                    )}
                  </div>

                  <h4 className="font-semibold text-sm text-foreground mb-1 leading-tight">
                    {ach.name}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {ach.description}
                  </p>
                </div>

                {/* Status / Progress Footer */}
                <div className="mt-4 pt-3 border-t border-border/50 text-xs">
                  {ach.is_earned ? (
                    <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>Earned milestone</span>
                      {formattedDate && <span className="font-medium text-foreground">{formattedDate}</span>}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-mono font-medium text-foreground">
                          {ach.current_value} / {ach.threshold}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-300"
                          style={{ width: `${ach.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
