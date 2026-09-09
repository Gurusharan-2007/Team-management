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

  // Refined, subtle SaaS palette
  const roleStyles: Record<UserRole, string> = {
    captain:
      "border-indigo-500/25 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs",
    vice_captain:
      "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300 font-medium",
    manager:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium",
    strategist:
      "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300 font-medium",
    member:
      "border-border bg-muted/60 text-muted-foreground font-medium",
  };

  const roleDots: Record<UserRole, string> = {
    captain: "bg-indigo-600 dark:bg-indigo-400 ring-2 ring-indigo-500/20",
    vice_captain: "bg-sky-500 ring-2 ring-sky-500/20",
    manager: "bg-emerald-500 ring-2 ring-emerald-500/20",
    strategist: "bg-violet-500 ring-2 ring-violet-500/20",
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
