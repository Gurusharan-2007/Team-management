import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  badgeText?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  badgeText,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/30 p-8 sm:p-12 text-center",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl border border-border/80 bg-muted/40 text-muted-foreground shadow-xs">
          <Icon className="h-5 w-5 stroke-[1.75]" />
        </div>
      )}
      {badgeText && (
        <span className="mb-2 inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          {badgeText}
        </span>
      )}
      <h4 className="text-sm font-semibold tracking-tight text-foreground">
        {title}
      </h4>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
