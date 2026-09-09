import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ring select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive/15 text-destructive border-destructive/25 shadow-xs",
        outline: "text-foreground border-border/80 bg-background/50",
        subtle: "border-border/60 bg-muted/60 text-muted-foreground",
        success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium",
        warning: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium",
        info: "border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
