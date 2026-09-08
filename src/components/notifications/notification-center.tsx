"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Clock,
  FileText,
  Sparkles,
  Award,
  Check,
  ArrowRight,
  TrendingUp,
  Target,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Notification, NotificationType } from "@/types/domain";
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from "@/actions/notifications";

interface NotificationCenterProps {
  initialNotifications: Notification[];
  initialUnreadCount: number;
}

export function NotificationCenter({
  initialNotifications,
  initialUnreadCount,
}: NotificationCenterProps) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<"all" | "unread">("all");
  const [notifications, setNotifications] = React.useState(initialNotifications);
  const [unreadCount, setUnreadCount] = React.useState(initialUnreadCount);
  const [markingId, setMarkingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setNotifications(initialNotifications);
    setUnreadCount(initialUnreadCount);
  }, [initialNotifications, initialUnreadCount]);

  const filteredNotifications = React.useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.is_read);
    return notifications;
  }, [notifications, filter]);

  async function handleMarkRead(id: string) {
    setMarkingId(id);
    try {
      await markNotificationAsReadAction(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      router.refresh();
    } finally {
      setMarkingId(null);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsAsReadAction();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      router.refresh();
    } catch {
      // Ignore
    }
  }

  function getIcon(type: NotificationType) {
    switch (type) {
      case "reminder":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "report":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "achievement":
        return <Award className="h-4 w-4 text-purple-500" />;
      case "point_change":
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      default:
        return <Sparkles className="h-4 w-4 text-primary" />;
    }
  }

  function getTypeBadge(type: NotificationType) {
    switch (type) {
      case "reminder":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">
            Reminder
          </Badge>
        );
      case "report":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px]">
            Report
          </Badge>
        );
      case "achievement":
        return (
          <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px]">
            Achievement
          </Badge>
        );
      case "point_change":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
            Points
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            System
          </Badge>
        );
    }
  }

  return (
    <Card className="border shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <CardTitle className="text-lg font-semibold">Notification Center</CardTitle>
              {unreadCount > 0 && (
                <Badge className="text-xs bg-primary/15 text-primary border-primary/30">
                  {unreadCount} Unread
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs mt-1">
              Real-time updates, Saturday report reminders, achievement badges, and points announcements.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Filter Toggle: ALL vs UNREAD */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filter === "all"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("unread")}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filter === "unread"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium"
                onClick={handleMarkAllRead}
              >
                <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {filteredNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            badgeText={filter === "unread" ? "Zero unread" : "All caught up"}
            title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
            description={
              filter === "unread"
                ? "You have acknowledged all system notifications and weekly reminders."
                : "Weekly check-ins, automated Saturday snapshots, and team achievements will be delivered here."
            }
            className="py-12 border-dashed"
          />
        ) : (
          <div className="divide-y divide-border/60">
            {filteredNotifications.map((n) => {
              // Determine action URL: either explicit action_url or type-based fallback
              const actionUrl =
                n.action_url ||
                (n.type === "reminder" ? "/reports" : n.type === "report" ? "/reports" : n.type === "achievement" ? "/leaderboard" : null);

              return (
                <div
                  key={n.id}
                  className={`flex items-start justify-between py-4 first:pt-2 last:pb-2 gap-4 transition-colors ${
                    !n.is_read ? "bg-primary/[0.03] -mx-4 px-4 rounded-lg" : ""
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted border border-border/80">
                      {getIcon(n.type)}
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            !n.is_read ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {n.title}
                        </span>
                        {!n.is_read && (
                          <span className="h-2 w-2 rounded-full bg-primary ring-2 ring-primary/20" />
                        )}
                        {getTypeBadge(n.type)}
                        <span className="text-xs text-muted-foreground ml-auto sm:ml-0">
                          {formatRelativeTime(n.created_at)}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {n.message}
                      </p>

                      {/* Action Link Button */}
                      {actionUrl && (
                        <div className="pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="h-7 text-xs font-medium"
                            onClick={() => {
                              if (!n.is_read) handleMarkRead(n.id);
                            }}
                          >
                            <Link href={actionUrl}>
                              <span>Open Details</span>
                              <ArrowRight className="ml-1.5 h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {!n.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={markingId === n.id}
                      onClick={() => handleMarkRead(n.id)}
                      className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      <span className="hidden sm:inline">Read</span>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
