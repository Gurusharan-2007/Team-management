import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/60", className)}
      {...props}
    />
  );
}

export function LoadingSpinner({
  className,
  text,
}: {
  className?: string;
  text?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      {text && <p className="mt-2 text-xs text-muted-foreground">{text}</p>}
    </div>
  );
}
