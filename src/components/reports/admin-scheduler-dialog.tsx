"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Shield,
  Bell,
  FileText,
  Calendar,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  runSaturdayRemindersAction,
  generateWeeklyReportAction,
} from "@/actions/reports";

interface AdminSchedulerDialogProps {
  teamTimezone: string;
  trigger?: React.ReactNode;
}

export function AdminSchedulerDialog({
  teamTimezone,
  trigger,
}: AdminSchedulerDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleRunReminder(
    type: "saturday_11am" | "saturday_4pm" | "saturday_6pm"
  ) {
    setLoadingAction(type);
    setResult(null);
    try {
      const res = await runSaturdayRemindersAction(type);
      if (res.success) {
        setResult({
          type: "success",
          text: res.message || `${type} executed. Notified ${res.membersNotified} members.`,
        });
        router.refresh();
      } else {
        setResult({ type: "error", text: res.error || "Failed to trigger reminder." });
      }
    } catch {
      setResult({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleGenerateReport() {
    setLoadingAction("generate_report");
    setResult(null);
    try {
      const res = await generateWeeklyReportAction();
      if (res.success) {
        setResult({
          type: "success",
          text: res.message || "8:00 PM Weekly Report generated successfully.",
        });
        router.refresh();
      } else {
        setResult({ type: "error", text: res.error || "Failed to generate report." });
      }
    } catch {
      setResult({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Saturday Automation &amp; Scheduler Controls
          </DialogTitle>
          <DialogDescription>
            Leadership controls to test, monitor, or trigger automated Saturday reminder cycles and 8:00 PM report generation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Centralized Timezone Info */}
          <div className="rounded-md border border-border/80 bg-muted/40 p-3 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Team Timezone Engine
              </span>
              <Badge variant="subtle" className="text-[10px] font-mono">
                {teamTimezone}
              </Badge>
            </div>
            <p className="text-muted-foreground text-[11px]">
              Schedules, Saturday update windows, and snapshot triggers resolve strictly in this timezone.
            </p>
          </div>

          {result && (
            <div
              className={`flex items-center gap-2 p-3 rounded-md text-xs ${
                result.type === "success"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}
            >
              {result.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{result.text}</span>
            </div>
          )}

          {/* Action Grid */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Automated Checkpoint Triggers
            </h4>

            {/* 11 AM Reminder */}
            <div className="rounded-md border border-border p-3 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-foreground">
                    11:00 AM Reminder
                  </span>
                  <Badge variant="subtle" className="text-[9px]">
                    Idempotent
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Sends reminder only to active members who haven&apos;t completed Saturday update.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs shrink-0"
                disabled={Boolean(loadingAction)}
                onClick={() => handleRunReminder("saturday_11am")}
              >
                {loadingAction === "saturday_11am" ? "Running..." : "Run 11 AM"}
              </Button>
            </div>

            {/* 4 PM Reminder */}
            <div className="rounded-md border border-border p-3 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-foreground">
                    4:00 PM Reminder
                  </span>
                  <Badge variant="subtle" className="text-[9px]">
                    Idempotent
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Sends reminder only to members still remaining un-updated.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs shrink-0"
                disabled={Boolean(loadingAction)}
                onClick={() => handleRunReminder("saturday_4pm")}
              >
                {loadingAction === "saturday_4pm" ? "Running..." : "Run 4 PM"}
              </Button>
            </div>

            {/* 6 PM Reminder */}
            <div className="rounded-md border border-border p-3 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-foreground">
                    6:00 PM Final Reminder
                  </span>
                  <Badge variant="subtle" className="text-[9px]">
                    Idempotent
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Final reminder before the 8:00 PM snapshot generation.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs shrink-0"
                disabled={Boolean(loadingAction)}
                onClick={() => handleRunReminder("saturday_6pm")}
              >
                {loadingAction === "saturday_6pm" ? "Running..." : "Run 6 PM"}
              </Button>
            </div>

            {/* 8 PM Report Generation */}
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/[0.02] p-3 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-foreground">
                    8:00 PM Report Generation
                  </span>
                  <Badge variant="success" className="text-[9px]">
                    Snapshot
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Aggregates active member points, courses, and check-ins into an immutable snapshot.
                </p>
              </div>
              <Button
                size="sm"
                className="text-xs shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={Boolean(loadingAction)}
                onClick={handleGenerateReport}
              >
                {loadingAction === "generate_report" ? "Generating..." : "Generate 8 PM Report"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
