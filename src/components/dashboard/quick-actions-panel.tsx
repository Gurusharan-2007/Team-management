"use client";

import * as React from "react";
import Link from "next/link";
import { Users, UserPlus, FileText, BookOpen, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface QuickActionsPanelProps {
  canManage?: boolean;
}

export function QuickActionsPanel({ canManage = true }: QuickActionsPanelProps) {
  const actions = [
    {
      title: "View Team",
      description: "Manage members",
      href: "/team",
      icon: Users,
      iconBg: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
    },
    {
      title: "Add Member",
      description: canManage ? "Invite your team" : "View directory",
      href: "/team",
      icon: UserPlus,
      iconBg: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
    },
    {
      title: "View Reports",
      description: "Weekly insights",
      href: "/reports",
      icon: FileText,
      iconBg: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
    },
    {
      title: "Open Courses",
      description: "Explore & learn",
      href: "/profile",
      icon: BookOpen,
      iconBg: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30",
    },
  ];

  return (
    <div className="glass-panel-dark rounded-2xl p-5 flex flex-col justify-between select-none">
      <div className="flex items-center justify-between pb-3.5 border-b border-border/60 dark:border-white/[0.06]">
        <h3 className="text-sm font-bold tracking-tight text-foreground dark:text-white">
          Quick Actions
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.title}
              href={act.href}
              className="group relative flex flex-col justify-between p-3.5 rounded-xl border border-border/70 bg-card/60 hover:bg-accent/40 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.07] hover:border-primary/40 dark:hover:border-cyan-400/40 hover:shadow-[0_0_18px_rgba(56,189,248,0.15)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl border ${act.iconBg}`}
                >
                  <Icon className="h-4 w-4 stroke-[2.2]" />
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground dark:text-slate-400 group-hover:text-primary dark:group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="mt-3 space-y-0.5">
                <div className="text-xs font-bold text-foreground dark:text-white group-hover:text-primary dark:group-hover:text-cyan-300 transition-colors">
                  {act.title}
                </div>
                <div className="text-[11px] text-muted-foreground dark:text-slate-400 truncate">
                  {act.description}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
