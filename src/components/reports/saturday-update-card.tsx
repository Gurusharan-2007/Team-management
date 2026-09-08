"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Zap,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { submitSaturdayUpdateAction } from "@/actions/reports";
import { formatDateTime, formatPoints } from "@/lib/utils";

interface SaturdayUpdateCardProps {
  initialActivityPoints: number;
  initialRewardPoints: number;
  hasUpdated: boolean;
  lastUpdateAt?: string | null;
  isLate?: boolean;
  deadlinePassed?: boolean;
}

export function SaturdayUpdateCard({
  initialActivityPoints,
  initialRewardPoints,
  hasUpdated: initialHasUpdated,
  lastUpdateAt: initialLastUpdateAt,
  isLate: initialIsLate = false,
  deadlinePassed = false,
}: SaturdayUpdateCardProps) {
  const router = useRouter();
  const [activityPoints, setActivityPoints] = React.useState(String(initialActivityPoints));
  const [rewardPoints, setRewardPoints] = React.useState(String(initialRewardPoints));
  const [hasUpdated, setHasUpdated] = React.useState(initialHasUpdated);
  const [lastUpdateAt, setLastUpdateAt] = React.useState(initialLastUpdateAt);
  const [isLate, setIsLate] = React.useState(initialIsLate);

  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const parsedAct = parseInt(activityPoints, 10);
    const parsedRew = parseInt(rewardPoints, 10);

    if (isNaN(parsedAct) || parsedAct < 0) {
      setMessage({ type: "error", text: "Activity Points must be 0 or higher." });
      return;
    }
    if (isNaN(parsedRew) || parsedRew < 0) {
      setMessage({ type: "error", text: "Reward Points must be 0 or higher." });
      return;
    }

    setLoading(true);
    try {
      const res = await submitSaturdayUpdateAction({
        activityPoints: parsedAct,
        rewardPoints: parsedRew,
      });

      if (!res.success) {
        setMessage({ type: "error", text: res.error || "Failed to submit weekly update." });
        setLoading(false);
        return;
      }

      setHasUpdated(true);
      setIsLate(Boolean(res.isLate));
      setLastUpdateAt(res.submittedAt || new Date().toISOString());
      setMessage({
        type: "success",
        text: res.message || "Weekly update recorded.",
      });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Saturday Weekly Check-In
            </CardTitle>
            <CardDescription className="text-xs">
              Confirm or update your verified points for this week&apos;s reporting cycle
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {hasUpdated ? (
              <Badge variant="success" className="text-[11px] gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {isLate ? "Updated (Late)" : "Updated"}
              </Badge>
            ) : (
              <Badge variant={deadlinePassed ? "destructive" : "warning"} className="text-[11px] gap-1">
                <Clock className="h-3 w-3" />
                {deadlinePassed ? "Update Missed" : "Not updated yet"}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Status notice */}
        <div className="rounded-md border border-border/70 p-3 bg-muted/40 text-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="font-medium text-foreground">Update Status:</span>{" "}
            <span className="text-muted-foreground">
              {hasUpdated && lastUpdateAt
                ? `Updated at ${formatDateTime(lastUpdateAt)} ${isLate ? "(Late)" : "(On Time)"}`
                : deadlinePassed
                ? "Saturday 8:00 PM deadline has passed. Updates will be recorded as late."
                : "Awaiting your Saturday check-in before 8:00 PM."}
            </span>
          </div>
        </div>

        {message && (
          <div
            className={`flex items-center gap-2 p-3 rounded-md text-xs ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Activity Points Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Activity Points Balance
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={activityPoints}
                onChange={(e) => setActivityPoints(e.target.value)}
                disabled={loading}
                required
              />
              <span className="text-[11px] text-muted-foreground">
                Verified task and milestone points
              </span>
            </div>

            {/* Reward Points Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-purple-500" />
                Reward Points Balance
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={rewardPoints}
                onChange={(e) => setRewardPoints(e.target.value)}
                disabled={loading}
                required
              />
              <span className="text-[11px] text-muted-foreground">
                Leadership recognitions and honors
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              Submission writes directly to this week&apos;s snapshot record.
            </span>
            <Button type="submit" size="sm" disabled={loading} className="text-xs">
              {loading ? "Recording..." : hasUpdated ? "Update Points" : "Submit Weekly Update"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
