import { NextRequest, NextResponse } from "next/server";
import { getCurrentTeamTime, isSaturdayInTeamTimezone } from "@/lib/date/week";
import { runSaturdayRemindersAction, generateWeeklyReportAction } from "@/actions/reports";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { isLeadership } from "@/lib/auth/permissions";

/**
 * Server-Side Scheduled Cron Runner
 *
 * Endpoint: /api/cron/weekly-scheduler
 * Protected by CRON_SECRET or Captain/Vice Captain administrative session.
 */
export async function GET(req: NextRequest) {
  return handleScheduler(req);
}

export async function POST(req: NextRequest) {
  return handleScheduler(req);
}

async function handleScheduler(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const customHeader = req.headers.get("x-cron-secret");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7)
    : null;

  const providedSecret = bearerToken || customHeader;
  const isProd = process.env.NODE_ENV === "production";
  const envSecret = process.env.CRON_SECRET || (isProd ? null : "default_dev_cron_secret_step6");

  let isAuthorized = !!envSecret && !!providedSecret && providedSecret === envSecret;

  // Fallback: Check if caller is Captain or Vice Captain via session
  if (!isAuthorized) {
    const currentUser = await getCurrentUser();
    if (currentUser.user && isLeadership(currentUser.role)) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing cron credentials" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const actionParam = searchParams.get("action") || "auto";

  const teamTime = getCurrentTeamTime();
  const isSaturday = isSaturdayInTeamTimezone();

  let executedJob = "";
  let notificationsSent = 0;
  let reportGenerated = false;
  let executionDetails: Record<string, any> = {
    teamTime,
    action: actionParam,
  };

  try {
    if (actionParam === "remind_11am") {
      executedJob = "saturday_11am_reminder";
      const res = await runSaturdayRemindersAction("saturday_11am", { isCron: true });
      notificationsSent = res.membersNotified;
      executionDetails.result = res;
    } else if (actionParam === "remind_4pm") {
      executedJob = "saturday_4pm_reminder";
      const res = await runSaturdayRemindersAction("saturday_4pm", { isCron: true });
      notificationsSent = res.membersNotified;
      executionDetails.result = res;
    } else if (actionParam === "remind_6pm") {
      executedJob = "saturday_6pm_reminder";
      const res = await runSaturdayRemindersAction("saturday_6pm", { isCron: true });
      notificationsSent = res.membersNotified;
      executionDetails.result = res;
    } else if (actionParam === "generate_report") {
      executedJob = "saturday_8pm_report_generation";
      const res = await generateWeeklyReportAction({ isCron: true });
      reportGenerated = res.success && !res.alreadyGenerated;
      executionDetails.result = res;
    } else {
      // Auto mode: evaluate current time in team timezone
      if (!isSaturday) {
        executedJob = "scheduler_idle_non_saturday";
        executionDetails.message = "Current day is not Saturday in the configured team timezone.";
      } else if (teamTime.hour === 11) {
        executedJob = "auto_saturday_11am_reminder";
        const res = await runSaturdayRemindersAction("saturday_11am", { isCron: true });
        notificationsSent = res.membersNotified;
        executionDetails.result = res;
      } else if (teamTime.hour === 16) {
        executedJob = "auto_saturday_4pm_reminder";
        const res = await runSaturdayRemindersAction("saturday_4pm", { isCron: true });
        notificationsSent = res.membersNotified;
        executionDetails.result = res;
      } else if (teamTime.hour === 18) {
        executedJob = "auto_saturday_6pm_reminder";
        const res = await runSaturdayRemindersAction("saturday_6pm", { isCron: true });
        notificationsSent = res.membersNotified;
        executionDetails.result = res;
      } else if (teamTime.hour >= 20) {
        executedJob = "auto_saturday_8pm_report_generation";
        const res = await generateWeeklyReportAction({ isCron: true });
        reportGenerated = res.success && !res.alreadyGenerated;
        executionDetails.result = res;
      } else {
        executedJob = "scheduler_idle_saturday_off_window";
        executionDetails.message = `Saturday ${teamTime.hour}:${teamTime.minute} is between scheduled checkpoint intervals.`;
      }
    }

    // Observability: Write log to cron_job_logs
    try {
      const supabase = await createClient();
      await (supabase.from("cron_job_logs") as any).insert({
        job_name: executedJob,
        status: "success",
        members_processed: notificationsSent,
        notifications_sent: notificationsSent,
        report_generated: reportGenerated,
        details: executionDetails,
        executed_at: new Date().toISOString(),
      });
    } catch {
      // Ignore logging failure in preview
    }

    return NextResponse.json({
      success: true,
      job: executedJob,
      notificationsSent,
      reportGenerated,
      details: executionDetails,
    });
  } catch (err: any) {
    // Log failure
    try {
      const supabase = await createClient();
      await (supabase.from("cron_job_logs") as any).insert({
        job_name: executedJob || "failed_cron_job",
        status: "failed",
        error_message: err?.message || String(err),
        details: executionDetails,
        executed_at: new Date().toISOString(),
      });
    } catch {
      // Ignore
    }

    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Scheduled execution failed",
      },
      { status: 500 }
    );
  }
}
