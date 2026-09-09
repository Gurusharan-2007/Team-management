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
  const steps = [
    {
      id: "step-1",
      title: "Complete 1 more technical course",
      points: "8 points",
      completed: false,
      href: "/profile",
    },
    {
      id: "step-2",
      title: "Update your weekly report",
      points: "50 points",
      completed: false,
      href: "/reports",
    },
    {
      id: "step-3",
      title: "Help a team member",
      points: "30 points",
      completed: true,
      href: "/team",
    },
  ];

  return (
    <Card className="glass-panel relative overflow-hidden rounded-3xl p-5 border-border/70 shadow-glass flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/[0.06]">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
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
          {steps.map((step) => {
            return (
              <Link
                key={step.id}
                href={step.href}
                className="group flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-card/40 dark:bg-white/[0.02] hover:bg-card/80 dark:hover:bg-white/[0.06] transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {step.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" />
                  )}
                  <span
                    className={`text-xs font-medium truncate ${
                      step.completed
                        ? "line-through text-muted-foreground"
                        : "text-foreground group-hover:text-primary transition-colors"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>

                <span className="text-[10px] font-mono font-semibold text-muted-foreground shrink-0 pl-2">
                  {step.points}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Motivational Bottom Pill (from reference image) */}
      <Link
        href="/leaderboard"
        className="mt-4 flex items-center justify-between p-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-purple-500/10 to-indigo-500/15 hover:border-amber-500/50 transition-all duration-200 group"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
            <Lightbulb className="h-4 w-4" />
          </div>
          <span className="text-xs font-semibold text-foreground group-hover:text-amber-300 transition-colors">
            Small steps create <span className="text-amber-400 font-bold">big results!</span>
          </span>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </Card>
  );
}
