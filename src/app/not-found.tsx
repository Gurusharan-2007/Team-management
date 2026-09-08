import Link from "next/link";
import { FileQuestion, ArrowLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
      <Card className="w-full max-w-md border-border/80 text-center shadow-md">
        <CardContent className="flex flex-col items-center p-8 space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileQuestion className="h-7 w-7 stroke-[1.75]" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              404 — Page Not Found
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The page you are looking for does not exist in the team portal or may have been moved.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2 w-full justify-center">
            <Button asChild size="sm" variant="default" className="text-xs">
              <Link href="/dashboard">
                <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                Go to Dashboard
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="text-xs">
              <Link href="/team">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Team Roster
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
