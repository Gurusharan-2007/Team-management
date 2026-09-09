"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Users,
  Trophy,
  FileText,
  Bell,
  Activity,
  Settings,
  Sun,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/role-badge";
import { type UserRole } from "@/types/domain";
import { isLeadership } from "@/lib/auth/permissions";

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
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const hasLeadership = isLeadership(userRole);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

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

  const navItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Team", href: "/team", icon: Users },
    { title: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { title: "Reports", href: "/reports", icon: FileText },
    {
      title: "Notifications",
      href: "/notifications",
      icon: Bell,
      badge: unreadNotificationsCount,
    },
    { title: "Activity", href: "/activity", icon: Activity },
    { title: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "relative flex h-[calc(100vh-1rem)] flex-col rounded-3xl border border-border/70 dark:border-white/10 glass-panel-primary text-sidebar-foreground transition-all duration-300 ease-in-out select-none my-2 ml-2 shadow-glass",
        isCollapsed ? "w-[68px]" : "w-[245px]",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-border/60 dark:border-white/[0.06] px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 overflow-hidden font-semibold tracking-tight group"
          onClick={onNavClick}
        >
          {/* Glowing 4-Point Cosmic Star Logo */}
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-600 to-indigo-600 shadow-[0_0_18px_rgba(56,189,248,0.6)] transition-transform duration-200 group-hover:scale-105">
            <svg
              className="h-4.5 w-4.5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          </div>
          {!isCollapsed && (
            <span className="truncate text-base font-bold tracking-tight text-foreground dark:text-white">
              Team Portal
            </span>
          )}
        </Link>

        {onToggleCollapse && !isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="hidden lg:flex h-7 w-7 text-muted-foreground hover:text-foreground dark:hover:text-white"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Main Navigation List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1.5">
        {navItems.map((item) => {
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
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white font-bold shadow-[0_0_20px_rgba(37,99,235,0.45)] border border-blue-400/40"
                  : "text-muted-foreground/80 hover:bg-muted/50 dark:hover:bg-white/[0.06] hover:text-foreground dark:hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground dark:group-hover:text-white"
                )}
              />
              {!isCollapsed && <span className="truncate">{item.title}</span>}

              {/* Notification Badge */}
              {!isCollapsed && item.badge !== undefined && item.badge > 0 ? (
                <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.6)]">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Bottom Area: Motivation Card + Dark Mode + Profile/Signout */}
      <div className="border-t border-border/40 p-3 space-y-3">
        {/* Motivational Card (from reference image) */}
        {!isCollapsed && (
          <div className="relative overflow-hidden rounded-xl border border-border/60 dark:border-white/10 bg-card/50 dark:bg-gradient-to-br dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/20 p-3 shadow-glass backdrop-blur-md">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground leading-snug">
                &ldquo;Great teams build great things&rdquo;
              </p>
              {/* Mini glowing sparkline curve */}
              <div className="pt-1.5">
                <svg className="w-full h-5 text-cyan-400/80" viewBox="0 0 100 24" fill="none">
                  <path
                    d="M0 18 Q 20 6, 40 14 T 70 8 T 100 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_6px_rgba(56,189,248,0.6)]"
                  />
                  <circle cx="100" cy="4" r="2.5" fill="#38bdf8" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Dark Mode Switch (from reference image) */}
        {mounted && (
          !isCollapsed ? (
            <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card/40 px-3 py-2 text-xs backdrop-blur-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                {isDark ? <Moon className="h-3.5 w-3.5 text-indigo-400" /> : <Sun className="h-3.5 w-3.5 text-amber-500" />}
                <span className="text-[11px] font-medium text-foreground/80">Dark Mode</span>
              </div>
              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  isDark ? "bg-primary" : "bg-muted"
                )}
                aria-label="Toggle dark mode"
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                    isDark ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="h-8 w-8 text-muted-foreground hover:text-foreground mx-auto flex items-center justify-center"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {isDark ? <Moon className="h-4 w-4 text-indigo-400" /> : <Sun className="h-4 w-4 text-amber-500" />}
            </Button>
          )
        )}

        {/* User Info & Signout */}
        <div className="flex items-center justify-between gap-1 pt-1">
          {!isCollapsed ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 overflow-hidden">
                <RoleBadge role={userRole} size="sm" />
                <span className="truncate text-xs text-muted-foreground">{userName}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 mx-auto"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
