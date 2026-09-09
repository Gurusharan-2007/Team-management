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
      iconColor: "text-blue-500 dark:text-cyan-400",
      iconBg: "bg-blue-500/10 dark:bg-cyan-500/15 border-blue-500/20",
    },
    {
      title: "Add Member",
      description: canManage ? "Invite your team" : "View directory",
      href: "/team",
      icon: UserPlus,
      iconColor: "text-cyan-500 dark:text-cyan-300",
      iconBg: "bg-cyan-500/10 dark:bg-cyan-500/15 border-cyan-500/20",
    },
    {
      title: "View Reports",
      description: "Weekly insights",
      href: "/reports",
      icon: FileText,
      iconColor: "text-purple-500 dark:text-purple-300",
      iconBg: "bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/20",
    },
    {
      title: "Open Courses",
      description: "Explore & learn",
      href: "/profile",
      icon: BookOpen,
      iconColor: "text-indigo-500 dark:text-indigo-300",
      iconBg: "bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-500/20",
    },
  ];

  return (
    <Card className="glass-panel border-border/70 p-5 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-3.5">
        <h3 className="text-sm font-bold tracking-tight text-foreground">
          Quick Actions
        </h3>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Shortcuts
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.title}
              href={act.href}
              className="group relative flex flex-col justify-between p-3.5 rounded-2xl border border-border/60 bg-card/40 hover:bg-card/80 dark:bg-white/[0.03] dark:hover:bg-white/[0.07] hover:border-primary/40 transition-all duration-200 hover:-translate-y-0.5 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border ${act.iconBg} ${act.iconColor}`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="mt-3 space-y-0.5">
                <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                  {act.title}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {act.description}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
