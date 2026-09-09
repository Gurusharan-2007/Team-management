"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, UserCheck, Award, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

export function FuturisticNotificationsCard() {
  const notifications = [
    {
      id: "notif-1",
      title: "New report is available",
      message: "Weekly report for this week is ready",
      time: "2h ago",
      icon: FileText,
      iconColor: "text-blue-500 dark:text-cyan-400",
      iconBg: "bg-blue-500/10 dark:bg-cyan-500/15 border-blue-500/20",
      unread: true,
      href: "/reports",
    },
    {
      id: "notif-2",
      title: "Team member updated",
      message: "Priya S changed their profile",
      time: "4h ago",
      icon: UserCheck,
      iconColor: "text-rose-500 dark:text-pink-400",
      iconBg: "bg-rose-500/10 dark:bg-pink-500/15 border-rose-500/20",
      unread: true,
      href: "/team",
    },
    {
      id: "notif-3",
      title: "Achievement unlocked",
      message: "You earned 'Course Explorer' badge",
      time: "5h ago",
      icon: Award,
      iconColor: "text-amber-500 dark:text-amber-400",
      iconBg: "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/20",
      unread: false,
      href: "/leaderboard",
    },
    {
      id: "notif-4",
      title: "Reminder",
      message: "Saturday 11 AM reminder scheduled",
      time: "1d ago",
      icon: Clock,
      iconColor: "text-cyan-500 dark:text-cyan-400",
      iconBg: "bg-cyan-500/10 dark:bg-cyan-500/15 border-cyan-500/20",
      unread: false,
      href: "/reports",
    },
  ];

  return (
    <Card className="glass-panel relative overflow-hidden rounded-3xl p-5 border-border/70 shadow-glass flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
        <h3 className="text-sm font-bold tracking-tight text-foreground">
          Notifications
        </h3>
        <Link
          href="/notifications"
          className="text-xs font-semibold text-primary hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="mt-2 divide-y divide-border/30">
        {notifications.map((n) => {
          const Icon = n.icon;
          return (
            <Link
              key={n.id}
              href={n.href}
              className="flex items-start justify-between gap-3 py-2.5 px-2 rounded-xl hover:bg-white/[0.03] transition-colors group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border ${n.iconBg} ${n.iconColor}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {n.title}
                    </span>
                    {n.unread && (
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(56,189,248,0.8)] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {n.message}
                  </p>
                </div>
              </div>

              <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                {n.time}
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
