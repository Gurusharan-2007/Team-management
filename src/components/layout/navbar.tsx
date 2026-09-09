"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RoleBadge } from "@/components/ui/role-badge";
import { getInitials } from "@/lib/utils";
import { Sidebar } from "./sidebar";
import { ROLE_LABELS, type UserRole } from "@/types/domain";

interface NavbarProps {
  userName?: string;
  userEmail?: string;
  userRole?: UserRole;
  unreadNotificationsCount?: number;
}

const ROUTE_NAMES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/team": "Team Directory",
  "/reports": "Weekly Reports",
  "/leaderboard": "Leaderboard",
  "/notifications": "Notifications",
  "/profile": "My Profile",
  "/activity": "Team Activity",
  "/settings": "Settings",
};

export function Navbar({
  userName = "Team Member",
  userEmail = "member@college.edu",
  userRole = "member",
  unreadNotificationsCount = 0,
}: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const currentRouteName =
    ROUTE_NAMES[pathname] ||
    Object.keys(ROUTE_NAMES).find((key) => pathname.startsWith(key))
      ? ROUTE_NAMES[
          Object.keys(ROUTE_NAMES).find((key) => pathname.startsWith(key))!
        ]
      : "Workspace";

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border/70 bg-background/80 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>

        {/* Minimal Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-foreground/80 tracking-tight">Team Portal</span>
          <span className="text-muted-foreground/30">/</span>
          <span className="font-medium text-foreground tracking-tight">
            {currentRouteName}
          </span>
        </nav>
      </div>

      {/* Right actions: Role pill, Theme toggle, Profile avatar */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:inline-flex">
          <RoleBadge role={userRole} size="sm" />
        </div>

        <ThemeToggle />

        {/* Notifications Icon Button */}
        <Link
          href="/notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground ring-2 ring-background">
              {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
            </span>
          )}
        </Link>

        <Link
          href="/profile"
          className="group flex items-center gap-2 rounded-full ring-offset-background transition-opacity hover:opacity-90 focus:outline-none focus:ring-1 focus:ring-ring"
          title={`Profile (${userName})`}
        >
          <Avatar className="h-7 w-7 border-border group-hover:border-foreground/40 transition-colors">
            <AvatarFallback className="text-[11px] font-semibold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>

      {/* Mobile drawer backdrop and sidebar */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-64 bg-background shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              userRole={userRole}
              userEmail={userEmail}
              userName={userName}
              unreadNotificationsCount={unreadNotificationsCount}
              onNavClick={() => setMobileMenuOpen(false)}
              className="w-full border-r-0"
            />
          </div>
        </div>
      )}
    </header>
  );
}
