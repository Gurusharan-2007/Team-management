"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";
import { formatWeekRange } from "@/lib/date/week";
import { WeeklyReport } from "@/types/domain";

interface ReportWeekSelectProps {
  reports: WeeklyReport[];
  selectedReportId?: string;
}

export function ReportWeekSelect({
  reports,
  selectedReportId,
}: ReportWeekSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (!reports || reports.length === 0) {
    return null;
  }

  const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const current = new URLSearchParams(Array.from(searchParams?.entries() || []));
    current.set("week", val);
    router.push(`/reports?${current.toString()}`);
  };

  const activeId = selectedReportId || reports[0]?.id;

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-1.5 border border-border bg-background rounded-md px-2.5 py-1.5 text-xs shadow-sm">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <select
          value={activeId}
          className="bg-transparent text-foreground text-xs font-medium focus:outline-none cursor-pointer pr-1"
          onChange={handleWeekChange}
          aria-label="Select reporting week"
        >
          {reports.map((r) => (
            <option key={r.id} value={r.id} className="bg-background text-foreground">
              {formatWeekRange(r.week_start, r.week_end)}{" "}
              {r.status === "open" ? "(Open)" : "(Finalized)"}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
