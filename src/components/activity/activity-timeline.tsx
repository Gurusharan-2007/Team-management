"use client";

import * as React from "react";
import { AuditLogWithActor, TimelineFilterCategory } from "@/types/domain";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleBadge } from "@/components/ui/role-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Search,
  Activity,
  Award,
  BookOpen,
  Target,
  Users,
  FileText,
  Settings,
  Sparkles,
  TrendingUp,
  Download,
  Filter,
} from "lucide-react";

interface ActivityTimelineProps {
  initialActivities: AuditLogWithActor[];
  totalCount: number;
}

const CATEGORIES: { id: TimelineFilterCategory; label: string; icon: React.ElementType }[] = [
  { id: "all", label: "All Events", icon: Activity },
  { id: "points", label: "Points", icon: TrendingUp },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "goals", label: "Goals", icon: Target },
  { id: "achievements", label: "Achievements", icon: Award },
  { id: "members", label: "Members", icon: Users },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

export function ActivityTimeline({ initialActivities, totalCount }: ActivityTimelineProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<TimelineFilterCategory>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredActivities = React.useMemo(() => {
    return initialActivities.filter((log) => {
      // Category filter
      if (selectedCategory !== "all") {
        const action = log.action;
        if (selectedCategory === "points" && action !== "points_adjusted") return false;
        if (
          selectedCategory === "courses" &&
          !["course_created", "course_updated", "course_deactivated", "course_completed", "course_uncompleted"].includes(action)
        )
          return false;
        if (
          selectedCategory === "goals" &&
          !["goal_created", "goal_updated", "goal_deactivated"].includes(action)
        )
          return false;
        if (
          selectedCategory === "achievements" &&
          action !== "achievement_unlocked" &&
          action !== "achievement_awarded"
        )
          return false;
        if (
          selectedCategory === "members" &&
          !["member_created", "member_updated", "member_activated", "member_deactivated", "role_changed"].includes(action)
        )
          return false;
        if (
          selectedCategory === "reports" &&
          !["report_submitted", "report_approved", "report_rejected", "weekly_report_generated"].includes(action)
        )
          return false;
        if (
          selectedCategory === "settings" &&
          !["settings_updated", "invitation_created", "invitation_revoked", "member_exported"].includes(action)
        )
          return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const m = (log.metadata || {}) as Record<string, any>;
        const actorName = log.actor?.full_name?.toLowerCase() || "";
        const targetName = log.target_profile?.full_name?.toLowerCase() || "";
        const action = log.action.toLowerCase();
        const reason = typeof m.reason === "string" ? m.reason.toLowerCase() : "";
        const title = typeof m.course_title === "string" ? m.course_title.toLowerCase() : "";
        const goalTitle = typeof m.title === "string" ? m.title.toLowerCase() : "";
        const achieveTitle = typeof m.achievement_title === "string" ? m.achievement_title.toLowerCase() : "";

        return (
          actorName.includes(q) ||
          targetName.includes(q) ||
          action.includes(q) ||
          reason.includes(q) ||
          title.includes(q) ||
          goalTitle.includes(q) ||
          achieveTitle.includes(q)
        );
      }

      return true;
    });
  }, [initialActivities, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search activity by member, action, or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 self-end sm:self-auto">
          <span>Showing {filteredActivities.length} of {totalCount} events</span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Timeline Stream */}
      {filteredActivities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity events found"
          description={
            searchQuery
              ? `No activity matches "${searchQuery}". Try refining your query.`
              : "No activity recorded under this category yet."
          }
          action={
            searchQuery ? (
              <Button variant="outline" size="sm" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="relative pl-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/60 space-y-4">
          {filteredActivities.map((log) => (
            <TimelineItem key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineItem({ log }: { log: AuditLogWithActor }) {
  const { title, description, categoryBadge, icon: ItemIcon } = formatLogDetails(log);

  return (
    <div className="relative flex items-start gap-4 p-4 rounded-xl border bg-card/60 backdrop-blur-sm shadow-xs transition-colors hover:bg-card/90">
      {/* Circle Icon Node on Timeline Line */}
      <div className="absolute -left-6 top-5 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-background border-2 border-primary/40">
        <div className="h-2 w-2 rounded-full bg-primary" />
      </div>

      {/* Actor Avatar */}
      <Avatar className="h-9 w-9 shrink-0 border">
        <AvatarFallback className="text-xs font-semibold">
          {getInitials(log.actor?.full_name || "System")}
        </AvatarFallback>
      </Avatar>

      {/* Details */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-foreground">
              {log.actor?.full_name || "System Automation"}
            </span>
            {log.actor?.role && <RoleBadge role={log.actor.role} size="sm" />}
            {categoryBadge}
          </div>
          <span className="text-xs text-muted-foreground shrink-0 font-medium">
            {formatRelativeTime(log.created_at)}
          </span>
        </div>

        {/* Narrative Title & Target User */}
        <div className="text-sm font-medium text-foreground/90 leading-snug">
          {title}
          {log.target_profile && (
            <span className="inline-flex items-center gap-1.5 ml-1.5 font-semibold text-primary">
              @{log.target_profile.full_name}
            </span>
          )}
        </div>

        {/* Supporting description / metadata note */}
        {description && (
          <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded-md border border-border/40 font-mono leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function formatLogDetails(log: AuditLogWithActor) {
  const m = (log.metadata || {}) as Record<string, any>;
  let title = "";
  let description = "";
  let categoryBadge = <Badge variant="outline" className="text-[10px]">Event</Badge>;
  let icon = Activity;

  switch (log.action) {
    case "points_adjusted":
      const pts = Number(m.amount) || 0;
      const ptType = m.point_type === "reward" ? "Reward Points" : "Activity Points";
      const sign = pts >= 0 ? `+${pts}` : `${pts}`;
      title = `Adjusted ${sign} ${ptType} for`;
      description = m.reason ? `Reason: "${m.reason}"` : "";
      categoryBadge = (
        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">
          Points
        </Badge>
      );
      icon = TrendingUp;
      break;

    case "course_created":
      title = `Created course "${m.course_title || "Technical Course"}"`;
      description = m.reward_points ? `Reward: +${m.reward_points} Reward Points` : "";
      categoryBadge = (
        <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px]">
          Course
        </Badge>
      );
      icon = BookOpen;
      break;

    case "course_completed":
      title = `Completed technical course "${m.course_title || "Course"}"`;
      categoryBadge = (
        <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px]">
          Course
        </Badge>
      );
      icon = BookOpen;
      break;

    case "achievement_unlocked":
    case "achievement_awarded":
      title = `Awarded achievement "${m.achievement_title || "Badge"}" to`;
      categoryBadge = (
        <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px]">
          Achievement
        </Badge>
      );
      icon = Award;
      break;

    case "goal_created":
      title = `Created new team goal "${m.title || "Goal"}"`;
      description = m.target_value ? `Target: ${m.target_value} points` : "";
      categoryBadge = (
        <Badge className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 text-[10px]">
          Goal
        </Badge>
      );
      icon = Target;
      break;

    case "role_changed":
      title = `Updated role from ${m.previous_role} to ${m.new_role} for`;
      categoryBadge = (
        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
          Role
        </Badge>
      );
      icon = Users;
      break;

    case "member_activated":
      title = `Reactivated team member`;
      categoryBadge = (
        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
          Member
        </Badge>
      );
      icon = Users;
      break;

    case "member_deactivated":
      title = `Deactivated team member`;
      categoryBadge = (
        <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 text-[10px]">
          Member
        </Badge>
      );
      icon = Users;
      break;

    case "settings_updated":
      title = "Updated team workspace configuration";
      description = m.updated_fields
        ? `Modified settings: ${(m.updated_fields as string[]).join(", ")}`
        : "";
      categoryBadge = (
        <Badge className="bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30 text-[10px]">
          Settings
        </Badge>
      );
      icon = Settings;
      break;

    case "member_exported":
      title = `Exported performance report (${m.exported_count || 0} members)`;
      description = m.filename ? `File: ${m.filename}` : "";
      categoryBadge = (
        <Badge className="bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 text-[10px]">
          Export
        </Badge>
      );
      icon = Download;
      break;

    case "weekly_report_generated":
      title = `Generated weekly performance report`;
      description = m.report_title ? `Report: ${m.report_title}` : "";
      categoryBadge = (
        <Badge className="bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30 text-[10px]">
          Report
        </Badge>
      );
      icon = FileText;
      break;

    default:
      title = `Recorded ${log.action.replace(/_/g, " ")}`;
      description = Object.keys(m).length > 0 ? JSON.stringify(m) : "";
      break;
  }

  return { title, description, categoryBadge, icon };
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
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
