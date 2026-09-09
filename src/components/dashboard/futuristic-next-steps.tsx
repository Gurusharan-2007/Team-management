"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Lightbulb, ArrowRight, BookOpen, FileText, HeartHandshake } from "lucide-react";
import { Card } from "@/components/ui/card";
import { GoalWithProgress } from "@/types/domain";

interface FuturisticNextStepsProps {
  goals?: GoalWithProgress[];
}

export function FuturisticNextSteps({ goals = [] }: FuturisticNextStepsProps) {
  const displayGoals = goals.slice(0, 4);

  return (
    <div className="glass-panel-dark relative overflow-hidden rounded-2xl p-5 select-none flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-border/60 dark:border-white/[0.06]">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
              </span>
              Next Steps
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Stay on track, keep growing!
            </p>
          </div>
        </div>

        {/* Step Checklist Items */}
        <div className="mt-3 space-y-2.5">
          {displayGoals.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
              <div className="h-9 w-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
              <p className="text-xs font-semibold text-foreground">No Active Goals</p>
              <p className="text-[11px] text-muted-foreground max-w-[200px] leading-relaxed">
                Team and individual targets will appear here once created.
              </p>
            </div>
          ) : (
            displayGoals.map((goal) => {
              const isDone = goal.is_completed || goal.progress_percentage >= 100;
              const radius = 8;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference - (Math.min(100, Math.max(0, goal.progress_percentage)) / 100) * circumference;

              return (
                <Link
                  key={goal.id}
                  href="/reports"
                  className="group flex items-center justify-between p-2.5 rounded-xl border border-border/60 dark:border-white/10 bg-card/40 dark:bg-white/[0.03] hover:bg-muted/50 dark:hover:bg-white/[0.07] hover:border-emerald-500/30 dark:hover:border-cyan-400/30 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Circular SVG percentage meter matching reference */}
                    <div className="relative flex items-center justify-center shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <svg className="h-4.5 w-4.5 -rotate-90" viewBox="0 0 20 20">
                          <circle
                            cx="10"
                            cy="10"
                            r={radius}
                            className="stroke-muted dark:stroke-white/15"
                            strokeWidth="2"
                            fill="none"
                          />
                          <circle
                            cx="10"
                            cy="10"
                            r={radius}
                            className="stroke-emerald-400 transition-all duration-500"
                            strokeWidth="2"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            fill="none"
                          />
                        </svg>
                      )}
                    </div>

                    <span
                      className={`text-xs font-semibold truncate ${
                        isDone
                          ? "line-through text-muted-foreground"
                          : "text-foreground group-hover:text-emerald-500 dark:group-hover:text-emerald-300 transition-colors"
                      }`}
                    >
                      {goal.title}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono font-medium text-muted-foreground shrink-0 pl-2">
                    {goal.target_points} pts
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Motivational Bottom Pill (from reference image) */}
      <Link
        href="/leaderboard"
        className="mt-4 flex items-center justify-between p-2.5 rounded-xl border border-border/60 dark:border-white/10 bg-card/40 dark:bg-white/[0.03] hover:bg-muted/50 dark:hover:bg-white/[0.07] hover:border-amber-500/30 dark:hover:border-cyan-400/30 transition-all duration-200 group"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Lightbulb className="h-4 w-4" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            Small steps create <span className="text-foreground font-bold">big results!</span>
          </span>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary dark:group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
