"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  Bell,
  Search,
  MessageSquare,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export function Navbar({
  userName = "Gurusharan G",
  userEmail = "member@team.internal",
  userRole = "captain",
  unreadNotificationsCount = 3,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/team?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-2 z-30 px-4 sm:px-6 py-2">
      <div className="flex h-14 w-full items-center justify-between rounded-2xl glass-panel px-4 shadow-glass transition-all">
        {/* Left: Mobile Menu & Search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          {/* Mobile menu trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>

          {/* Futuristic Floating Search Pill (from reference image) */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center w-full max-w-md"
          >
            <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground/70 pointer-events-none" />
            <input
              id="global-search-input"
              type="text"
              placeholder="Search team members, courses, or anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-background/50 dark:bg-white/[0.04] border border-border/60 py-2 pl-9 pr-14 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all backdrop-blur-md"
            />
            <kbd className="absolute right-2.5 hidden sm:inline-flex items-center gap-0.5 rounded border border-border/70 bg-muted/40 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </form>
        </div>

        {/* Right Actions: Notifications, Updates, Profile Dropdown */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Notification Button with Pill Badge (from reference image) */}
          <Link
            href="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-background/50 dark:bg-white/[0.04] border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all shadow-xs"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-xs">
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </span>
            )}
          </Link>

          {/* Activity / Messages Icon */}
          <Link
            href="/activity"
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-background/50 dark:bg-white/[0.04] border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all shadow-xs"
            title="Activity Feed"
          >
            <MessageSquare className="h-4 w-4" />
          </Link>

          {/* User Profile Chip (from reference image) */}
          <Link
            href="/profile"
            className="flex items-center gap-2.5 rounded-xl bg-background/50 dark:bg-white/[0.04] border border-border/60 p-1.5 pr-2.5 hover:bg-muted/40 transition-all shadow-xs group select-none"
            title="My Profile"
          >
            <Avatar className="h-8 w-8 rounded-lg border border-border/80">
              <AvatarFallback className="text-xs font-semibold bg-gradient-to-tr from-blue-600 to-indigo-600 text-white">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-tight">
                {userName}
              </span>
              <span className="text-[10px] text-muted-foreground capitalize leading-tight">
                {ROLE_LABELS[userRole] || userRole}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        </div>
      </div>

      {/* Mobile drawer backdrop and sidebar */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 bg-background shadow-2xl"
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
