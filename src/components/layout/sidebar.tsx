"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Trophy,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/role-badge";
import { type UserRole } from "@/types/domain";
import { isLeadership, canViewActivityTimeline } from "@/lib/auth/permissions";

interface SidebarProps {
  userRole?: UserRole;
  userEmail?: string;
  userName?: string;
  unreadNotificationsCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
  onNavClick?: () => void;
}

interface NavItemConfig {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export function Sidebar({
  userRole = "member",
  userEmail,
  userName = "Team Member",
  unreadNotificationsCount = 0,
  isCollapsed = false,
  onToggleCollapse,
  className,
  onNavClick,
}: SidebarProps) {
  const pathname = usePathname();
  const hasLeadership = isLeadership(userRole);
  const canSeeTimeline = canViewActivityTimeline(userRole);

  const handleSignOut = async () => {
    try {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/auth/signout";
      document.body.appendChild(form);
      form.submit();
    } catch {
      window.location.href = "/login";
    }
  };

  // Section 1: Overview (Universal)
  const overviewItems: NavItemConfig[] = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Team Roster", href: "/team", icon: Users },
    { title: "Weekly Reports", href: "/reports", icon: FileText },
    { title: "Leaderboard", href: "/leaderboard", icon: Trophy },
  ];

  // Section 2: Personal (Universal)
  const personalItems: NavItemConfig[] = [
    { title: "My Profile", href: "/profile", icon: User },
    {
      title: "Notifications",
      href: "/notifications",
      icon: Bell,
      badge: unreadNotificationsCount,
    },
    ...(!hasLeadership
      ? [{ title: "Settings", href: "/settings", icon: Settings }]
      : []),
  ];

  // Section 3: Leadership (Captain, Vice Captain, Manager, Strategist)
  const leadershipItems: NavItemConfig[] = [];
  if (canSeeTimeline) {
    leadershipItems.push({
      title: "Team Activity",
      href: "/activity",
      icon: Activity,
    });
  }
  if (hasLeadership) {
    leadershipItems.push({
      title: "Admin Settings",
      href: "/settings",
      icon: Sliders,
    });
  }

  const renderNavGroup = (label: string, items: NavItemConfig[]) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-1 pt-2 first:pt-0">
        {!isCollapsed && (
          <div className="px-2.5 pb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {label}
            </span>
          </div>
        )}
        {items.map((item) => {
          const isExact = pathname === item.href;
          const isNested = item.href !== "/dashboard" && pathname.startsWith(item.href);
          const isActive = isExact || isNested;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              title={isCollapsed ? item.title : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors select-none",
                isActive
                  ? "bg-sidebar-accent text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {!isCollapsed && <span className="truncate">{item.title}</span>}

              {!isCollapsed && item.badge !== undefined && item.badge > 0 ? (
                <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              ) : (
                !isCollapsed && isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )
              )}
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[64px]" : "w-[240px]",
        className
      )}
    >
      {/* Workspace Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3.5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 overflow-hidden font-semibold text-foreground tracking-tight"
          onClick={onNavClick}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground text-background font-bold text-xs tracking-wider">
            AN
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-xs font-semibold uppercase tracking-wider text-foreground">
                Team Portal
              </span>
              <span className="truncate text-[10px] text-muted-foreground">
                College Org Workspace
              </span>
            </div>
          )}
        </Link>
        {onToggleCollapse && !isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="hidden lg:flex h-7 w-7 text-muted-foreground hover:text-foreground"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {renderNavGroup("Overview", overviewItems)}
        {renderNavGroup("Personal", personalItems)}
        {leadershipItems.length > 0 && renderNavGroup("Leadership", leadershipItems)}
      </div>

      {/* Role and User Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-2">
        {!isCollapsed && (
          <div className="rounded-lg border border-sidebar-border/80 bg-background/50 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                Assigned Role
              </span>
              <RoleBadge role={userRole} size="sm" />
            </div>
            <div className="truncate text-xs font-medium text-foreground">
              {userName}
            </div>
            {userEmail && (
              <div className="truncate text-[10px] text-muted-foreground font-mono">
                {userEmail}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-1">
          {onToggleCollapse && isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "sm"}
            onClick={handleSignOut}
            className={cn(
              "text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
              isCollapsed ? "h-8 w-8" : "w-full justify-start text-xs h-8"
            )}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span className="ml-2">Sign out</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
