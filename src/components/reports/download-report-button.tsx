"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, AlertCircle } from "lucide-react";

interface DownloadReportButtonProps {
  reportId: string;
  weekStart: string;
  weekEnd: string;
  isFinalized: boolean;
  className?: string;
}

export function DownloadReportButton({
  reportId,
  weekStart,
  weekEnd,
  isFinalized,
  className,
}: DownloadReportButtonProps) {
  const [downloading, setDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDownload = async () => {
    if (!isFinalized || downloading) return;

    try {
      setDownloading(true);
      setError(null);

      const params = new URLSearchParams();
      if (reportId) {
        params.set("reportId", reportId);
      }
      if (weekStart) {
        params.set("week", weekStart);
      }

      const res = await fetch(`/api/reports/download-pdf?${params.toString()}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to download report PDF (HTTP ${res.status}).`
        );
      }

      // Extract filename from Content-Disposition header if available
      const disposition = res.headers.get("content-disposition");
      let filename = `Team-Portal-Weekly-Report-${weekStart}-to-${weekEnd}.pdf`;
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^";]+)"?/i);
        if (match && match[1]) {
          filename = match[1].trim();
        }
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement("a");
      tempLink.href = blobUrl;
      tempLink.download = filename;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      console.error("[DownloadReportButton] Download failed:", err);
      setError(err?.message || "Failed to download report document.");
    } finally {
      setDownloading(false);
    }
  };

  if (!isFinalized) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="text-xs h-7 px-2.5 opacity-60 cursor-not-allowed border-dashed"
        title="Weekly report documents are available once the Saturday 8:00 PM cycle snapshot is finalized."
      >
        <Download className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
        Download Report
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={downloading}
        className={`text-xs h-7 px-2.5 bg-background/80 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all font-medium shadow-2xs ${className || ""}`}
        title={`Download weekly performance report PDF for ${weekStart} to ${weekEnd}`}
      >
        {downloading ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-primary" />
            Generating PDF...
          </>
        ) : (
          <>
            <Download className="mr-1.5 h-3.5 w-3.5 text-primary" />
            Download Report
          </>
        )}
      </Button>

      {error && (
        <span className="flex items-center gap-1 text-[10px] text-destructive mt-0.5">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </span>
      )}
    </div>
  );
}
