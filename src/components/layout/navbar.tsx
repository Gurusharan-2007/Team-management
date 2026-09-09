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
  userAvatar?: string | null;
  unreadNotificationsCount?: number;
}

export function Navbar({
  userName = "Gurusharan G",
  userEmail = "member@team.internal",
  userRole = "captain",
  userAvatar = null,
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
    <header className="sticky top-2 z-30 px-2 sm:px-3 py-1">
      <div className="flex h-14 w-full items-center justify-between transition-all">
        {/* Left: Mobile Menu & Search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          {/* Mobile menu trigger */}
          {/* Mobile menu trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-muted-foreground hover:text-foreground dark:hover:text-white shrink-0"
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
            <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground dark:text-white/60 pointer-events-none" />
            <input
              id="global-search-input"
              type="text"
              placeholder="Search team members, courses, or anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full bg-card/70 dark:bg-white/[0.08] border border-border/70 dark:border-white/15 py-2 pl-10 pr-14 text-xs text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/60 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-border dark:focus:border-white/30 transition-all backdrop-blur-xl shadow-xs"
            />
            <kbd className="absolute right-2.5 hidden sm:inline-flex items-center gap-0.5 rounded-full border border-border/70 dark:border-white/20 bg-muted/50 dark:bg-white/[0.08] px-2 py-0.5 text-[10px] font-mono text-muted-foreground dark:text-white/80">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </form>
        </div>

        {/* Right Actions: Notifications, Messages, Profile Dropdown */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Notification Button with Pill Badge (from reference image) */}
          <Link
            href="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-card/70 dark:bg-white/[0.08] border border-border/70 dark:border-white/15 text-muted-foreground dark:text-white/90 hover:text-foreground dark:hover:text-white hover:bg-muted/50 dark:hover:bg-white/[0.14] transition-all shadow-xs backdrop-blur-xl"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.7)]">
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </span>
            )}
          </Link>

          {/* Activity / Messages Icon */}
          <Link
            href="/activity"
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-card/70 dark:bg-white/[0.08] border border-border/70 dark:border-white/15 text-muted-foreground dark:text-white/90 hover:text-foreground dark:hover:text-white hover:bg-muted/50 dark:hover:bg-white/[0.14] transition-all shadow-xs backdrop-blur-xl"
            title="Activity Feed"
          >
            <MessageSquare className="h-4 w-4" />
          </Link>

          {/* User Profile Chip (from reference image) */}
          <Link
            href="/profile"
            className="flex items-center gap-2.5 rounded-full bg-card/70 dark:bg-white/[0.08] border border-border/70 dark:border-white/15 p-1 pr-3 hover:bg-muted/50 dark:hover:bg-white/[0.14] transition-all shadow-xs backdrop-blur-xl group select-none"
            title="My Profile"
          >
            <Avatar className="h-7.5 w-7.5 rounded-full border border-border/60 dark:border-white/25">
              {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
              <AvatarFallback className="text-[11px] font-bold bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-foreground dark:text-white group-hover:text-primary dark:group-hover:text-cyan-300 transition-colors leading-tight">
                {userName}
              </span>
              <span className="text-[10px] text-muted-foreground dark:text-slate-300 capitalize leading-tight">
                {ROLE_LABELS[userRole] || userRole}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground dark:text-slate-300 group-hover:text-foreground dark:group-hover:text-white transition-colors" />
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
