"use client";

import * as React from "react";
import { TeamSettings } from "@/types/domain";
import { updateTeamSettingsAction } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, ShieldAlert, Globe2 } from "lucide-react";

interface TeamSettingsFormProps {
  initialSettings: TeamSettings;
}

const COMMON_TIMEZONES = [
  { value: "Asia/Kolkata", label: "India Standard Time (IST) - Asia/Kolkata (+05:30)" },
  { value: "UTC", label: "Coordinated Universal Time (UTC) (+00:00)" },
  { value: "America/New_York", label: "Eastern Time (US) - America/New_York (-05:00)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US) - America/Los_Angeles (-08:00)" },
  { value: "Europe/London", label: "Greenwich Mean Time (UK) - Europe/London (+00:00)" },
  { value: "Europe/Berlin", label: "Central European Time - Europe/Berlin (+01:00)" },
  { value: "Asia/Dubai", label: "Gulf Standard Time - Asia/Dubai (+04:00)" },
  { value: "Asia/Singapore", label: "Singapore Standard Time - Asia/Singapore (+08:00)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time - Asia/Tokyo (+09:00)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time - Australia/Sydney (+10:00)" },
];

export function TeamSettingsForm({ initialSettings }: TeamSettingsFormProps) {
  const [teamName, setTeamName] = React.useState(initialSettings.team_name);
  const [teamDesc, setTeamDesc] = React.useState(initialSettings.team_description || "");
  const [timezone, setTimezone] = React.useState(initialSettings.timezone);

  const [isLoading, setIsLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await updateTeamSettingsAction({
        team_name: teamName,
        team_description: teamDesc,
        timezone,
      });

      if (!res.success) {
        setFeedback({ type: "error", message: res.error || "Failed to update team settings." });
      } else {
        setFeedback({ type: "success", message: "Team settings saved successfully." });
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
        <CardTitle className="text-lg">Team Identity & Workspace</CardTitle>
        <CardDescription>
          Configure the public team name, engineering mission, and centralized organization timezone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Team / Organization Name</label>
            <Input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Apex Engineering Team"
              required
              minLength={2}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              Displayed on headers, leaderboards, and exported reports.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Team Description & Mission</label>
            <textarea
              value={teamDesc}
              onChange={(e) => setTeamDesc(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Provide a brief statement describing the team's engineering goals..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">
              Maximum 500 characters.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Globe2 className="h-4 w-4 text-muted-foreground" />
              Organization Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              All weekly report snapshots, reminders, and deadlines will align to this timezone.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Team Settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
