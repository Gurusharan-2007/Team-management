import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AccessDeniedProps {
  title?: string;
  message?: string;
  requiredRole?: string;
}

export function AccessDenied({
  title = "Access Denied",
  message = "You do not have the required permissions to view this resource.",
  requiredRole,
}: AccessDeniedProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md border-border/80 text-center shadow-sm">
        <CardContent className="flex flex-col items-center p-8 space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6 stroke-[1.75]" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {message}
            </p>
            {requiredRole && (
              <p className="text-[11px] text-muted-foreground/80 font-mono">
                Required role: {requiredRole}
              </p>
            )}
          </div>

          <div className="pt-2">
            <Button asChild size="sm" variant="outline" className="text-xs">
              <Link href="/dashboard">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
