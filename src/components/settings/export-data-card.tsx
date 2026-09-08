"use client";

import * as React from "react";
import { exportTeamPerformanceCSVAction } from "@/actions/export";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, FileSpreadsheet, ShieldCheck, CheckCircle2, ShieldAlert } from "lucide-react";

export function ExportDataCard() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleExport = async () => {
    setIsLoading(true);
    setFeedback(null);

    try {
      const res = await exportTeamPerformanceCSVAction();

      if (!res.success || !res.csvContent) {
        setFeedback({
          type: "error",
          message: res.error || "Failed to generate export file.",
        });
        return;
      }

      // Trigger browser download via Blob
      const blob = new Blob([res.csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", res.filename || `team-performance-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFeedback({
        type: "success",
        message: `Successfully generated and downloaded ${res.records?.length || 0} member performance records!`,
      });
      setTimeout(() => setFeedback(null), 5000);
    } catch {
      setFeedback({
        type: "error",
        message: "An unexpected error occurred during export generation.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border shadow-xs">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Data Export & Compliance</CardTitle>
            <CardDescription>
              Generate structured exports of current active member performance, point balances, and completion statistics.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs bg-muted/40 font-mono">
            Format: CSV
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
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

        <div className="p-4 rounded-xl border bg-card/60 space-y-3">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold">Team Performance & Milestones Dataset</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Exports complete team analytics formatted for Microsoft Excel, Google Sheets, or custom statistical analysis scripts. The generated CSV dataset includes:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground pt-1">
            <div className="p-2 rounded bg-muted/30 border border-border/40">• Member Name & Email</div>
            <div className="p-2 rounded bg-muted/30 border border-border/40">• Role & Active Status</div>
            <div className="p-2 rounded bg-muted/30 border border-border/40">• Activity Points Total</div>
            <div className="p-2 rounded bg-muted/30 border border-border/40">• Reward Points Total</div>
            <div className="p-2 rounded bg-muted/30 border border-border/40">• Completed Courses Count</div>
            <div className="p-2 rounded bg-muted/30 border border-border/40">• Overall Performance Score</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>All exports are logged to the leadership audit timeline for accountability.</span>
          </div>
          <Button onClick={handleExport} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating CSV...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Performance Data (CSV)
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
