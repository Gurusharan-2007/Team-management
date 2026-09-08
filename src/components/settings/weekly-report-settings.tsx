"use client";

import * as React from "react";
import { TeamSettings } from "@/types/domain";
import { updateTeamSettingsAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, ShieldAlert, Clock, Bell, CalendarCheck, ShieldCheck } from "lucide-react";

interface WeeklyReportSettingsProps {
  initialSettings: TeamSettings;
}

export function WeeklyReportSettings({ initialSettings }: WeeklyReportSettingsProps) {
  const [remindersEnabled, setRemindersEnabled] = React.useState(
    initialSettings.saturday_reminders_enabled
  );
  const [autoReportEnabled, setAutoReportEnabled] = React.useState(
    initialSettings.auto_reports_enabled
  );

  const [isLoading, setIsLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSave = async () => {
    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await updateTeamSettingsAction({
        saturday_reminders_enabled: remindersEnabled,
        auto_reports_enabled: autoReportEnabled,
      });

      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to update reporting automations." });
      } else {
        setFeedback({ type: "success", message: "Reporting automations updated successfully." });
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch {
      setFeedback({ type: "error", message: "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border shadow-xs">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Weekly Reporting & Automation Schedules</CardTitle>
            <CardDescription>
              Configure automated Saturday reminders, cutoff periods, and automated team report snapshot generation.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs bg-muted/40 font-mono">
            Timezone: {initialSettings.timezone}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {feedback && (
          <div
            className={`p-3.5 rounded-lg text-sm flex items-center gap-2.5 ${
              feedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <ShieldAlert className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Toggles */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl border bg-card/60">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold">Saturday Reminder Notifications</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When enabled, active members receive automated push notifications at 11:00 AM, 4:00 PM, and 6:00 PM on Saturdays reminding them to submit weekly metrics before the deadline.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={remindersEnabled}
                onChange={(e) => setRemindersEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-start justify-between gap-4 p-4 rounded-xl border bg-card/60">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Automatic Weekly Report Generation</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When enabled, the server cron automates weekly snapshot archiving every Saturday at 8:00 PM ({initialSettings.timezone}). Balances, trends, and completion metrics freeze into an unalterable historical record.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={autoReportEnabled}
                onChange={(e) => setAutoReportEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        {/* Schedule Transparency Card */}
        <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>Documented Cron Automation Cadence</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-background border border-border/50">
              <div className="font-semibold text-foreground">11:00 AM Saturday</div>
              <div className="text-muted-foreground mt-0.5">First notification reminder to pending members.</div>
            </div>
            <div className="p-2.5 rounded-lg bg-background border border-border/50">
              <div className="font-semibold text-foreground">4:00 PM Saturday</div>
              <div className="text-muted-foreground mt-0.5">Midday update nudge for outstanding reports.</div>
            </div>
            <div className="p-2.5 rounded-lg bg-background border border-border/50">
              <div className="font-semibold text-foreground">6:00 PM Saturday</div>
              <div className="text-muted-foreground mt-0.5">Final 2-hour warning before point lock.</div>
            </div>
            <div className="p-2.5 rounded-lg bg-background border border-border/50">
              <div className="font-semibold text-foreground">8:00 PM Saturday</div>
              <div className="text-muted-foreground mt-0.5">Automated team report generation & freeze.</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Schedule triggers use deterministic server crons configured via Supabase pg_cron / Edge Functions.</span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Automation Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
