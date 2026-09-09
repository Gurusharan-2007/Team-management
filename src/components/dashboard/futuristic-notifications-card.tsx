"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, UserCheck, Award, Clock, Bell, Zap, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Notification } from "@/types/domain";

interface FuturisticNotificationsCardProps {
  notifications?: Notification[];
}

function formatRelativeTime(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return "";
  }
}

export function FuturisticNotificationsCard({
  notifications = [],
}: FuturisticNotificationsCardProps) {
  const displayNotifs = React.useMemo(() => {
    return notifications.slice(0, 4).map((n) => {
      let icon = FileText;
      let iconColor = "text-sky-400";
      let iconBg = "bg-sky-500/15 border border-sky-500/30";

      if (n.type === "reminder") {
        icon = Clock;
        iconColor = "text-blue-400";
        iconBg = "bg-blue-500/15 border border-blue-500/30";
      } else if (n.type === "achievement") {
        icon = Award;
        iconColor = "text-amber-400";
        iconBg = "bg-amber-500/15 border border-amber-500/30";
      } else if (n.type === "system") {
        icon = UserCheck;
        iconColor = "text-rose-400";
        iconBg = "bg-rose-500/15 border border-rose-500/30";
      }

      return {
        id: n.id,
        title: n.title,
        message: n.message,
        time: formatRelativeTime(n.created_at),
        icon,
        iconColor,
        iconBg,
        unread: !n.is_read,
        href: n.action_url || "/notifications",
      };
    });
  }, [notifications]);

  return (
    <div className="glass-panel-dark relative overflow-hidden rounded-2xl p-5 select-none flex flex-col justify-between h-full">
      <div className="flex items-center justify-between pb-3 border-b border-border/60 dark:border-white/[0.06]">
        <h3 className="text-sm font-bold tracking-tight text-foreground">
          Notifications
        </h3>
        <Link
          href="/notifications"
          className="text-xs font-semibold text-blue-500 dark:text-blue-400 hover:underline transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="mt-2 divide-y divide-border/40 dark:divide-white/[0.04]">
        {displayNotifs.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-2">
            <div className="h-9 w-9 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Bell className="h-4.5 w-4.5" />
            </div>
            <p className="text-xs font-semibold text-foreground">All Caught Up</p>
            <p className="text-[11px] text-muted-foreground max-w-[200px] leading-relaxed">
              No pending notifications or weekly reminders right now.
            </p>
          </div>
        ) : (
          displayNotifs.map((n) => {
          const Icon = n.icon;
          return (
            <Link
              key={n.id}
              href={n.href}
              className="flex items-center justify-between gap-3 py-2 px-1.5 rounded-xl hover:bg-muted/40 dark:hover:bg-white/[0.05] transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${n.iconBg} ${n.iconColor}`}
                >
                  <Icon className="h-4 w-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs font-bold text-foreground group-hover:text-primary dark:group-hover:text-blue-300 transition-colors truncate">
                    {n.title}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {n.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-muted-foreground font-mono">
                  {n.time}
                </span>
                {n.unread && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)] shrink-0" />
                )}
              </div>
            </Link>
          );
        })
      )}
      </div>
    </div>
  );
}
