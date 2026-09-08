"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log sanitized error context to console (avoids leaking internals to the UI)
    console.error("Application error captured:", error.message, error.digest);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
      <Card className="w-full max-w-md border-destructive/30 text-center shadow-md">
        <CardContent className="flex flex-col items-center p-8 space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-7 w-7 stroke-[1.75]" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Something went wrong
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              An unexpected error occurred while processing your request. The engineering team has been notified.
            </p>
            {error.digest && (
              <p className="text-[10px] text-muted-foreground/60 font-mono">
                Error Reference: {error.digest}
              </p>
            )}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2 w-full justify-center">
            <Button
              size="sm"
              variant="default"
              className="text-xs"
              onClick={() => reset()}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Try Again
            </Button>
            <Button asChild size="sm" variant="outline" className="text-xs">
              <Link href="/dashboard">
                <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
