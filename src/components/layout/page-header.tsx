import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  children,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 pb-5 pt-1 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 mb-6",
        className
      )}
      {...props}
    >
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-muted-foreground sm:text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-0 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
