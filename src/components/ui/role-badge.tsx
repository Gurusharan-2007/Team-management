import * as React from "react";
import { UserRole, ROLE_LABELS } from "@/types/domain";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: UserRole | string | null | undefined;
  className?: string;
  size?: "sm" | "default";
}

export function RoleBadge({
  role = "member",
  className,
  size = "default",
}: RoleBadgeProps) {
  const normalizedRole = (role as UserRole) || "member";
  const label = ROLE_LABELS[normalizedRole] || "Member";

  // Refined, subtle SaaS palette (Linear/Vercel inspired)
  const roleStyles: Record<UserRole, string> = {
    captain:
      "border-foreground/20 bg-foreground/10 text-foreground font-semibold dark:bg-foreground/15",
    vice_captain:
      "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-medium",
    manager:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium",
    strategist:
      "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300 font-medium",
    member:
      "border-border/80 bg-muted/50 text-muted-foreground font-normal",
  };

  const roleDots: Record<UserRole, string> = {
    captain: "bg-foreground",
    vice_captain: "bg-blue-500",
    manager: "bg-emerald-500",
    strategist: "bg-purple-500",
    member: "bg-muted-foreground/60",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 tracking-wide select-none transition-colors",
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-[11px]",
        roleStyles[normalizedRole] || roleStyles.member,
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          roleDots[normalizedRole] || roleDots.member
        )}
      />
      <span>{label}</span>
    </span>
  );
}
