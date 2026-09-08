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
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-card/40 p-8 text-center",
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background/80 text-muted-foreground">
          <Icon className="h-5 w-5 stroke-[1.5]" />
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
