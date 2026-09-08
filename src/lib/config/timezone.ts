/**
 * Centralized Team Timezone Configuration
 *
 * All weekly reporting schedules (Saturday boundaries, 11 AM/4 PM/6 PM reminders,
 * and 8 PM report generation) MUST be resolved in this timezone.
 */

export const DEFAULT_TEAM_TIMEZONE = "Asia/Kolkata";

export function getTeamTimezone(): string {
  const envTz =
    process.env.NEXT_PUBLIC_TEAM_TIMEZONE ||
    process.env.TEAM_TIMEZONE ||
    DEFAULT_TEAM_TIMEZONE;

  try {
    // Validate that the timezone is recognized by the runtime Intl engine
    Intl.DateTimeFormat(undefined, { timeZone: envTz });
    return envTz;
  } catch {
    return DEFAULT_TEAM_TIMEZONE;
  }
}
