import { getTeamTimezone } from "@/lib/config/timezone";

export interface ReportingWeekInfo {
  weekStart: string; // YYYY-MM-DD (Sunday)
  weekEnd: string;   // YYYY-MM-DD (Saturday)
  weekLabel: string; // e.g. "Sep 6 – Sep 12, 2026"
}

export interface TeamTimeInfo {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: string;
  dayOfWeek: number; // 0 = Sun, 6 = Sat
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Returns the current calendar parts in the centralized team timezone.
 */
export function getCurrentTeamTime(date: Date = new Date()): TeamTimeInfo {
  const timeZone = getTeamTimezone();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const part of parts) {
    partMap[part.type] = part.value;
  }

  const year = parseInt(partMap.year || "2026", 10);
  const month = parseInt(partMap.month || "1", 10);
  const day = parseInt(partMap.day || "1", 10);
  const hour = parseInt(partMap.hour || "0", 10);
  const minute = parseInt(partMap.minute || "0", 10);
  const weekday = partMap.weekday || "Sun";
  const dayOfWeek = WEEKDAY_INDEX[weekday] ?? 0;

  return { year, month, day, hour, minute, weekday, dayOfWeek };
}

/**
 * Given any reference date, resolves the Sunday → Saturday reporting week boundaries.
 */
export function getReportingWeek(referenceDate: Date = new Date()): ReportingWeekInfo {
  const teamTime = getCurrentTeamTime(referenceDate);

  // Pure calendar date representation
  const targetUtc = new Date(Date.UTC(teamTime.year, teamTime.month - 1, teamTime.day));

  // Sunday is (targetUtc - dayOfWeek days)
  const sundayUtc = new Date(targetUtc.getTime() - teamTime.dayOfWeek * 86400000);
  // Saturday is (sundayUtc + 6 days)
  const saturdayUtc = new Date(sundayUtc.getTime() + 6 * 86400000);

  const weekStart = sundayUtc.toISOString().slice(0, 10);
  const weekEnd = saturdayUtc.toISOString().slice(0, 10);

  return {
    weekStart,
    weekEnd,
    weekLabel: formatWeekRange(weekStart, weekEnd),
  };
}

/**
 * Formats a Sunday-to-Saturday range into a clean human label (e.g. "Sep 6 – Sep 12, 2026").
 */
export function formatWeekRange(weekStart: string, weekEnd: string): string {
  try {
    const [sYear, sMonth, sDay] = weekStart.split("-").map(Number);
    const [eYear, eMonth, eDay] = weekEnd.split("-").map(Number);

    const sDate = new Date(Date.UTC(sYear, sMonth - 1, sDay));
    const eDate = new Date(Date.UTC(eYear, eMonth - 1, eDay));

    const sFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(sDate);
    const eFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(eDate);

    return `${sFmt} – ${eFmt}`;
  } catch {
    return `${weekStart} to ${weekEnd}`;
  }
}

/**
 * Checks if the reference time is Saturday in the configured team timezone.
 */
export function isSaturdayInTeamTimezone(referenceDate: Date = new Date()): boolean {
  const teamTime = getCurrentTeamTime(referenceDate);
  return teamTime.dayOfWeek === 6;
}

/**
 * Checks if the reference time is past the Saturday 8:00 PM reporting deadline for this week.
 */
export function isPastSaturday8pm(referenceDate: Date = new Date()): boolean {
  const teamTime = getCurrentTeamTime(referenceDate);
  // Saturday at or after 20:00 (8:00 PM)
  if (teamTime.dayOfWeek === 6 && teamTime.hour >= 20) {
    return true;
  }
  return false;
}

/**
 * Calculates the previous Sunday-to-Saturday reporting week given a weekStart string.
 */
export function getPreviousWeekRange(weekStart: string): { weekStart: string; weekEnd: string } {
  const [year, month, day] = weekStart.split("-").map(Number);
  const curSunday = new Date(Date.UTC(year, month - 1, day));
  const prevSunday = new Date(curSunday.getTime() - 7 * 86400000);
  const prevSaturday = new Date(prevSunday.getTime() + 6 * 86400000);

  return {
    weekStart: prevSunday.toISOString().slice(0, 10),
    weekEnd: prevSaturday.toISOString().slice(0, 10),
  };
}
