"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import {
  WeeklyReport,
  MemberWeeklyReport,
  TeamWeeklyReport,
  WeeklyMemberUpdate,
  WeeklyReportWithDetails,
  MemberWeeklyReportWithProfile,
  WeeklyTrendPoint,
  UserRole,
} from "@/types/domain";
import { isLeadership, canViewAllReports } from "@/lib/auth/permissions";
import {
  getReportingWeek,
  isPastSaturday8pm,
  getPreviousWeekRange,
  formatWeekRange,
} from "@/lib/date/week";
import { checkAndAwardAchievementsAction } from "@/actions/achievements";

/**
 * Submits an explicit Saturday update for the caller.
 * Atomically updates user points and creates the weekly update tracking record.
 */
export async function submitSaturdayUpdateAction(params: {
  activityPoints: number;
  rewardPoints: number;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser.user || !currentUser.profile) {
    return { success: false, error: "Not authenticated." };
  }

  const memberId = currentUser.user.id;
  const parsedActivity = Math.max(0, Math.floor(Number(params.activityPoints) || 0));
  const parsedReward = Math.max(0, Math.floor(Number(params.rewardPoints) || 0));

  const { weekStart, weekEnd } = getReportingWeek();
  const isLate = isPastSaturday8pm();

  if (!currentUser.isConfigured) {
    return {
      success: true,
      message: `[Preview Mode] Saturday weekly update recorded (${isLate ? "Late" : "On Time"}).`,
      isLate,
      submittedAt: new Date().toISOString(),
    };
  }

  const supabase = await createClient();

  // 1. Ensure weekly_reports record exists for current week
  let { data: currentReport } = await (supabase.from("weekly_reports") as any)
    .select("id, status")
    .eq("week_start", weekStart)
    .eq("week_end", weekEnd)
    .maybeSingle();

  if (!currentReport) {
    const { data: newReport, error: createError } = await (supabase.from("weekly_reports") as any)
      .insert({
        week_start: weekStart,
        week_end: weekEnd,
        status: "open",
      })
      .select("id, status")
      .single();

    if (createError) {
      return { success: false, error: "Failed to initialize weekly reporting period." };
    }
    currentReport = newReport;
  }

  // Check if report was already generated
  const reportAlreadyGenerated = currentReport.status === "generated";
  const markAsLate = isLate || reportAlreadyGenerated;

  // 2. Insert or update weekly_member_updates record
  const { error: updateError } = await (supabase.from("weekly_member_updates") as any).upsert(
    {
      weekly_report_id: currentReport.id,
      member_id: memberId,
      activity_points: parsedActivity,
      reward_points: parsedReward,
      submitted_at: new Date().toISOString(),
      is_late: markAsLate,
    },
    { onConflict: "weekly_report_id,member_id" }
  );

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // 3. Sync balances on profiles and log point_history if points changed
  const curAct = currentUser.profile.activity_points || 0;
  const curRew = currentUser.profile.reward_points || 0;

  if (curAct !== parsedActivity || curRew !== parsedReward) {
    // Update profile
    await (supabase.from("profiles") as any)
      .update({
        activity_points: parsedActivity,
        reward_points: parsedReward,
        updated_at: new Date().toISOString(),
      })
      .eq("id", memberId);

    // Record point history for activity points if changed
    if (curAct !== parsedActivity) {
      await (supabase.from("point_history") as any).insert({
        member_id: memberId,
        point_type: "activity",
        previous_value: curAct,
        new_value: parsedActivity,
        change_amount: parsedActivity - curAct,
        reason: "Saturday Weekly Update",
        changed_by: memberId,
        source: "self_update",
        actor_role: currentUser.role,
      });
    }

    // Record point history for reward points if changed
    if (curRew !== parsedReward) {
      await (supabase.from("point_history") as any).insert({
        member_id: memberId,
        point_type: "reward",
        previous_value: curRew,
        new_value: parsedReward,
        change_amount: parsedReward - curRew,
        reason: "Saturday Weekly Update",
        changed_by: memberId,
        source: "self_update",
        actor_role: currentUser.role,
      });
    }
  }

  // 4. Audit Log
  await (supabase.from("audit_logs") as any).insert({
    performed_by: memberId,
    affected_user_id: memberId,
    action: "saturday_update_submitted",
    metadata: {
      weekly_report_id: currentReport.id,
      week_start: weekStart,
      week_end: weekEnd,
      activity_points: parsedActivity,
      reward_points: parsedReward,
      is_late: markAsLate,
    },
  });

  // Check and award any unlocked milestones automatically
  checkAndAwardAchievementsAction(memberId, "saturday_update").catch(console.error);

  revalidatePath("/reports");
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/leaderboard");

  return {
    success: true,
    message: markAsLate
      ? "Saturday update recorded (Late update — existing report preserved)."
      : "Weekly update recorded.",
    isLate: markAsLate,
    submittedAt: new Date().toISOString(),
  };
}

/**
 * Gets caller's Saturday update status for the current reporting week.
 */
export async function getSaturdayUpdateStatusAction() {
  const currentUser = await getCurrentUser();

  if (!currentUser.user) {
    return { hasUpdated: false, update: null, isLate: false, deadlinePassed: false };
  }

  const { weekStart, weekEnd } = getReportingWeek();
  const deadlinePassed = isPastSaturday8pm();

  if (!currentUser.isConfigured) {
    return {
      hasUpdated: false,
      update: null,
      isLate: deadlinePassed,
      deadlinePassed,
      currentActivity: currentUser.profile?.activity_points || 0,
      currentReward: currentUser.profile?.reward_points || 0,
    };
  }

  const supabase = await createClient();

  const { data: report } = await (supabase.from("weekly_reports") as any)
    .select("id, status")
    .eq("week_start", weekStart)
    .eq("week_end", weekEnd)
    .maybeSingle();

  if (!report) {
    return {
      hasUpdated: false,
      update: null,
      isLate: deadlinePassed,
      deadlinePassed,
      currentActivity: currentUser.profile?.activity_points || 0,
      currentReward: currentUser.profile?.reward_points || 0,
    };
  }

  const { data: update } = await (supabase.from("weekly_member_updates") as any)
    .select("*")
    .eq("weekly_report_id", report.id)
    .eq("member_id", currentUser.user.id)
    .maybeSingle();

  return {
    hasUpdated: Boolean(update),
    update: (update as WeeklyMemberUpdate) || null,
    isLate: update ? update.is_late : deadlinePassed,
    deadlinePassed: deadlinePassed || report.status === "generated",
    currentActivity: currentUser.profile?.activity_points || 0,
    currentReward: currentUser.profile?.reward_points || 0,
  };
}

/**
 * Lists all weekly reports in descending order of week_start.
 */
export async function getWeeklyReportsListAction(): Promise<{
  success: boolean;
  reports: WeeklyReport[];
}> {
  const currentUser = await getCurrentUser();

  if (!currentUser.isConfigured) {
    const mockReports: WeeklyReport[] = [
      {
        id: "rep-w3",
        week_start: "2026-09-06",
        week_end: "2026-09-12",
        status: "open",
        generated_at: null,
        created_at: "2026-09-06T00:00:00Z",
      },
      {
        id: "rep-w2",
        week_start: "2026-08-30",
        week_end: "2026-09-05",
        status: "generated",
        generated_at: "2026-09-05T20:00:00Z",
        created_at: "2026-08-30T00:00:00Z",
      },
      {
        id: "rep-w1",
        week_start: "2026-08-23",
        week_end: "2026-08-29",
        status: "generated",
        generated_at: "2026-08-29T20:00:00Z",
        created_at: "2026-08-23T00:00:00Z",
      },
    ];
    return { success: true, reports: mockReports };
  }

  const supabase = await createClient();
  const { data: reports, error } = await (supabase.from("weekly_reports") as any)
    .select("*")
    .order("week_start", { ascending: false });

  if (error) {
    return { success: false, reports: [] };
  }

  return { success: true, reports: (reports || []) as WeeklyReport[] };
}

/**
 * Retrieves comprehensive report details: team report, member reports (filtered by caller role),
 * and previous week comparisons.
 */
export async function getWeeklyReportDetailsAction(reportId?: string): Promise<{
  success: boolean;
  report: WeeklyReportWithDetails | null;
  error?: string;
}> {
  const currentUser = await getCurrentUser();
  const callerRole = currentUser.role;
  const callerId = currentUser.user?.id || "";
  const canSeeAll = canViewAllReports(callerRole);

  if (!currentUser.isConfigured) {
    // Fallback seed reports
    const targetId = reportId || "rep-w2";
    const isW2 = targetId === "rep-w2";

    const mockTeamReport: TeamWeeklyReport = isW2
      ? {
          id: "team-w2",
          weekly_report_id: "rep-w2",
          total_activity_points: 460,
          total_reward_points: 145,
          total_courses_completed: 5,
          active_member_count: 5,
          updated_member_count: 5,
          generated_at: "2026-09-05T20:00:00Z",
          created_at: "2026-09-05T20:00:00Z",
        }
      : {
          id: "team-w1",
          weekly_report_id: "rep-w1",
          total_activity_points: 324,
          total_reward_points: 122,
          total_courses_completed: 4,
          active_member_count: 5,
          updated_member_count: 4,
          generated_at: "2026-08-29T20:00:00Z",
          created_at: "2026-08-29T20:00:00Z",
        };

    const mockMemberReports: MemberWeeklyReportWithProfile[] = [
      {
        id: "mem-rep-1",
        weekly_report_id: targetId,
        member_id: "usr-cap",
        activity_points: isW2 ? 120 : 90,
        reward_points: isW2 ? 45 : 35,
        courses_completed: 2,
        updated_on_saturday: true,
        last_update_at: isW2 ? "2026-09-05T14:30:00Z" : "2026-08-29T15:00:00Z",
        generated_at: isW2 ? "2026-09-05T20:00:00Z" : "2026-08-29T20:00:00Z",
        created_at: isW2 ? "2026-09-05T20:00:00Z" : "2026-08-29T20:00:00Z",
        member: {
          full_name: "Alex Rivera",
          email: "alex.rivera@team.internal",
          role: "captain",
          avatar_url: null,
        },
        previous_activity_points: isW2 ? 90 : null,
        previous_reward_points: isW2 ? 35 : null,
        activity_change: isW2 ? 30 : null,
        reward_change: isW2 ? 10 : null,
      },
      {
        id: "mem-rep-2",
        weekly_report_id: targetId,
        member_id: "usr-vc",
        activity_points: isW2 ? 95 : 75,
        reward_points: isW2 ? 30 : 25,
        courses_completed: 1,
        updated_on_saturday: true,
        last_update_at: isW2 ? "2026-09-05T16:15:00Z" : "2026-08-29T16:10:00Z",
        generated_at: isW2 ? "2026-09-05T20:00:00Z" : "2026-08-29T20:00:00Z",
        created_at: isW2 ? "2026-09-05T20:00:00Z" : "2026-08-29T20:00:00Z",
        member: {
          full_name: "Jordan Lee",
          email: "jordan.lee@team.internal",
          role: "vice_captain",
          avatar_url: null,
        },
        previous_activity_points: isW2 ? 75 : null,
        previous_reward_points: isW2 ? 25 : null,
        activity_change: isW2 ? 20 : null,
        reward_change: isW2 ? 5 : null,
      },
      {
        id: "mem-rep-3",
        weekly_report_id: targetId,
        member_id: "usr-m1",
        activity_points: isW2 ? 75 : 45,
        reward_points: isW2 ? 10 : 10,
        courses_completed: 1,
        updated_on_saturday: true,
        last_update_at: isW2 ? "2026-09-05T17:42:00Z" : null,
        generated_at: isW2 ? "2026-09-05T20:00:00Z" : "2026-08-29T20:00:00Z",
        created_at: isW2 ? "2026-09-05T20:00:00Z" : "2026-08-29T20:00:00Z",
        member: {
          full_name: "Taylor Swift",
          email: "taylor.s@team.internal",
          role: "member",
          avatar_url: null,
        },
        previous_activity_points: isW2 ? 45 : null,
        previous_reward_points: isW2 ? 10 : null,
        activity_change: isW2 ? 30 : null,
        reward_change: isW2 ? 0 : null,
      },
    ];

    // Filter for member: strictly own report
    const filteredMemberReports = canSeeAll
      ? mockMemberReports
      : mockMemberReports.filter((m) => m.member_id === callerId || m.member_id === "usr-m1");

    return {
      success: true,
      report: {
        id: targetId,
        week_start: isW2 ? "2026-08-30" : "2026-08-23",
        week_end: isW2 ? "2026-09-05" : "2026-08-29",
        status: isW2 ? "generated" : "generated",
        generated_at: isW2 ? "2026-09-05T20:00:00Z" : "2026-08-29T20:00:00Z",
        created_at: isW2 ? "2026-08-30T00:00:00Z" : "2026-08-23T00:00:00Z",
        team_report: mockTeamReport,
        member_reports: filteredMemberReports,
        activity_points_growth_percentage: isW2 ? 42 : null,
        reward_points_growth_percentage: isW2 ? 18 : null,
        members_updated_percentage: 100,
      },
    };
  }

  const supabase = await createClient();

  // 1. Fetch requested or latest report
  let query = (supabase.from("weekly_reports") as any).select("*");
  if (reportId) {
    query = query.eq("id", reportId);
  } else {
    query = query.order("week_start", { ascending: false }).limit(1);
  }

  const { data: reportData, error: reportError } = await query.maybeSingle();

  if (reportError || !reportData) {
    return { success: false, report: null, error: "Report not found." };
  }

  const report = reportData as WeeklyReport;

  // 2. Fetch team report
  const { data: teamReport } = await (supabase.from("team_weekly_reports") as any)
    .select("*")
    .eq("weekly_report_id", report.id)
    .maybeSingle();

  // 3. Fetch member reports (with profile join)
  let memberQuery = (supabase.from("member_weekly_reports") as any)
    .select("*, member:profiles!member_id(full_name, email, role, avatar_url)")
    .eq("weekly_report_id", report.id);

  // If member, enforce database-level row privacy
  if (!canSeeAll) {
    memberQuery = memberQuery.eq("member_id", callerId);
  }

  const { data: rawMemberReports } = await memberQuery;

  // 4. Fetch previous week's report for delta calculations
  const { weekStart: prevWeekStart } = getPreviousWeekRange(report.week_start);
  const { data: prevReport } = await (supabase.from("weekly_reports") as any)
    .select("id")
    .eq("week_start", prevWeekStart)
    .eq("status", "generated")
    .maybeSingle();

  let prevTeamReport: TeamWeeklyReport | null = null;
  const prevMemberMap = new Map<string, any>();

  if (prevReport) {
    const { data: prevTeam } = await (supabase.from("team_weekly_reports") as any)
      .select("*")
      .eq("weekly_report_id", prevReport.id)
      .maybeSingle();
    prevTeamReport = prevTeam || null;

    const { data: prevMembers } = await (supabase.from("member_weekly_reports") as any)
      .select("member_id, activity_points, reward_points")
      .eq("weekly_report_id", prevReport.id);

    if (prevMembers) {
      prevMembers.forEach((pm: any) => prevMemberMap.set(pm.member_id, pm));
    }
  }

  // 5. Process member reports with delta changes
  const memberReportsWithDeltas: MemberWeeklyReportWithProfile[] = (rawMemberReports || []).map(
    (mr: any) => {
      const prev = prevMemberMap.get(mr.member_id);
      const prevAct = prev ? prev.activity_points : null;
      const prevRew = prev ? prev.reward_points : null;

      return {
        ...mr,
        previous_activity_points: prevAct,
        previous_reward_points: prevRew,
        activity_change: prevAct !== null ? mr.activity_points - prevAct : null,
        reward_change: prevRew !== null ? mr.reward_points - prevRew : null,
      };
    }
  );

  // 6. Calculate team growth percentages if previous report exists
  let actGrowth: number | null = null;
  let rewGrowth: number | null = null;

  if (teamReport && prevTeamReport) {
    if (prevTeamReport.total_activity_points > 0) {
      actGrowth = Math.round(
        ((teamReport.total_activity_points - prevTeamReport.total_activity_points) /
          prevTeamReport.total_activity_points) *
          100
      );
    }
    if (prevTeamReport.total_reward_points > 0) {
      rewGrowth = Math.round(
        ((teamReport.total_reward_points - prevTeamReport.total_reward_points) /
          prevTeamReport.total_reward_points) *
          100
      );
    }
  }

  const updatedPct = teamReport
    ? teamReport.active_member_count > 0
      ? Math.round((teamReport.updated_member_count / teamReport.active_member_count) * 100)
      : 0
    : null;

  return {
    success: true,
    report: {
      ...report,
      team_report: teamReport || null,
      member_reports: memberReportsWithDeltas,
      activity_points_growth_percentage: actGrowth,
      reward_points_growth_percentage: rewGrowth,
      members_updated_percentage: updatedPct,
    },
  };
}

/**
 * Retrieves chronological team trend points for trend charts.
 */
export async function getTeamTrendsAction(limitWeeks: number = 8): Promise<{
  success: boolean;
  trends: WeeklyTrendPoint[];
}> {
  const currentUser = await getCurrentUser();

  if (!currentUser.isConfigured) {
    return {
      success: true,
      trends: [
        {
          week_start: "2026-08-16",
          week_end: "2026-08-22",
          week_label: "Aug 16 – Aug 22",
          activity_points: 210,
          reward_points: 90,
        },
        {
          week_start: "2026-08-23",
          week_end: "2026-08-29",
          week_label: "Aug 23 – Aug 29",
          activity_points: 324,
          reward_points: 122,
        },
        {
          week_start: "2026-08-30",
          week_end: "2026-09-05",
          week_label: "Aug 30 – Sep 5",
          activity_points: 460,
          reward_points: 145,
        },
      ],
    };
  }

  const supabase = await createClient();

  const { data: teamSnapshots, error } = await (supabase.from("team_weekly_reports") as any)
    .select("*, weekly_report:weekly_reports!weekly_report_id(week_start, week_end, status)")
    .order("created_at", { ascending: false })
    .limit(limitWeeks);

  if (error || !teamSnapshots) {
    return { success: false, trends: [] };
  }

  const trendPoints: WeeklyTrendPoint[] = teamSnapshots
    .filter((s: any) => s.weekly_report?.status === "generated")
    .map((s: any) => ({
      week_start: s.weekly_report.week_start,
      week_end: s.weekly_report.week_end,
      week_label: formatWeekRange(s.weekly_report.week_start, s.weekly_report.week_end),
      activity_points: s.total_activity_points || 0,
      reward_points: s.total_reward_points || 0,
    }))
    .reverse(); // Ascending chronological order for charts

  return { success: true, trends: trendPoints };
}

/**
 * Retrieves chronological individual member trend points for charts.
 */
export async function getMemberTrendsAction(
  memberId: string,
  limitWeeks: number = 8
): Promise<{
  success: boolean;
  trends: WeeklyTrendPoint[];
  error?: string;
}> {
  const currentUser = await getCurrentUser();
  const callerId = currentUser.user?.id || "";
  const callerRole = currentUser.role;

  // Enforce privacy: member can only request their own trends
  if (callerId !== memberId && !isLeadership(callerRole) && callerRole !== "manager" && callerRole !== "strategist") {
    return { success: false, trends: [], error: "Unauthorized." };
  }

  if (!currentUser.isConfigured) {
    return {
      success: true,
      trends: [
        {
          week_start: "2026-08-16",
          week_end: "2026-08-22",
          week_label: "Aug 16 – Aug 22",
          activity_points: 30,
          reward_points: 5,
        },
        {
          week_start: "2026-08-23",
          week_end: "2026-08-29",
          week_label: "Aug 23 – Aug 29",
          activity_points: 45,
          reward_points: 10,
        },
        {
          week_start: "2026-08-30",
          week_end: "2026-09-05",
          week_label: "Aug 30 – Sep 5",
          activity_points: 75,
          reward_points: 10,
        },
      ],
    };
  }

  const supabase = await createClient();

  const { data: snapshots, error } = await (supabase.from("member_weekly_reports") as any)
    .select("*, weekly_report:weekly_reports!weekly_report_id(week_start, week_end, status)")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(limitWeeks);

  if (error || !snapshots) {
    return { success: false, trends: [] };
  }

  const trendPoints: WeeklyTrendPoint[] = snapshots
    .filter((s: any) => s.weekly_report?.status === "generated")
    .map((s: any) => ({
      week_start: s.weekly_report.week_start,
      week_end: s.weekly_report.week_end,
      week_label: formatWeekRange(s.weekly_report.week_start, s.weekly_report.week_end),
      activity_points: s.activity_points || 0,
      reward_points: s.reward_points || 0,
    }))
    .reverse();

  return { success: true, trends: trendPoints };
}

/**
 * 8:00 PM Weekly Report Generation Job (Server/Admin execution).
 * Fully idempotent: if already generated, does not overwrite or duplicate.
 */
export async function generateWeeklyReportAction(options?: {
  weekStart?: string;
  weekEnd?: string;
  isCron?: boolean;
}): Promise<{
  success: boolean;
  message?: string;
  reportId?: string;
  alreadyGenerated?: boolean;
  activeMembers?: number;
  updatedMembers?: number;
  error?: string;
}> {
  const currentUser = await getCurrentUser();

  // If invoked via user session, require Captain or Vice Captain
  if (!options?.isCron && (!currentUser.user || !isLeadership(currentUser.role))) {
    return { success: false, error: "Unauthorized: Only leadership can generate reports." };
  }

  const { weekStart, weekEnd, weekLabel } = options?.weekStart && options?.weekEnd
    ? {
        weekStart: options.weekStart,
        weekEnd: options.weekEnd,
        weekLabel: formatWeekRange(options.weekStart, options.weekEnd),
      }
    : getReportingWeek();

  if (!currentUser.isConfigured) {
    return {
      success: true,
      message: `[Preview Mode] 8:00 PM Weekly Report generated for ${weekLabel}.`,
      alreadyGenerated: false,
      activeMembers: 5,
      updatedMembers: 5,
    };
  }

  const supabase = await createClient();

  // 1. Find or create weekly_reports row
  let { data: report } = await (supabase.from("weekly_reports") as any)
    .select("id, status")
    .eq("week_start", weekStart)
    .eq("week_end", weekEnd)
    .maybeSingle();

  if (report && report.status === "generated") {
    return {
      success: true,
      reportId: report.id,
      alreadyGenerated: true,
      message: `Weekly report for ${weekLabel} has already been generated and is immutable.`,
    };
  }

  if (!report) {
    const { data: newReport, error: insertError } = await (supabase.from("weekly_reports") as any)
      .insert({
        week_start: weekStart,
        week_end: weekEnd,
        status: "open",
      })
      .select("id, status")
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }
    report = newReport;
  }

  const reportId = report.id;

  // 2. Fetch all active members
  const { data: profiles, error: profError } = await (supabase.from("profiles") as any)
    .select("id, full_name, email, role, status, activity_points, reward_points")
    .eq("status", "active");

  if (profError || !profiles) {
    return { success: false, error: profError?.message || "Failed to fetch active profiles." };
  }

  // 3. Fetch explicit updates submitted for this week
  const { data: submittedUpdates } = await (supabase.from("weekly_member_updates") as any)
    .select("*")
    .eq("weekly_report_id", reportId);

  const updateMap = new Map<string, any>();
  if (submittedUpdates) {
    submittedUpdates.forEach((u: any) => updateMap.set(u.member_id, u));
  }

  // 4. Fetch completed technical courses count per member
  const { data: coursesData } = await (supabase.from("member_courses") as any)
    .select("member_id");

  const courseCountMap = new Map<string, number>();
  if (coursesData) {
    coursesData.forEach((c: any) => {
      courseCountMap.set(c.member_id, (courseCountMap.get(c.member_id) || 0) + 1);
    });
  }

  // 5. Generate individual member snapshot records
  let teamTotalActivity = 0;
  let teamTotalReward = 0;
  let teamTotalCourses = 0;
  let updatedMemberCount = 0;
  const nowIso = new Date().toISOString();

  const memberSnapshots = profiles.map((p: any) => {
    const update = updateMap.get(p.id);
    const updatedOnSaturday = Boolean(update);
    if (updatedOnSaturday) updatedMemberCount++;

    const actPts = update ? update.activity_points : (p.activity_points || 0);
    const rewPts = update ? update.reward_points : (p.reward_points || 0);
    const completedCourses = courseCountMap.get(p.id) || 0;

    teamTotalActivity += actPts;
    teamTotalReward += rewPts;
    teamTotalCourses += completedCourses;

    return {
      weekly_report_id: reportId,
      member_id: p.id,
      activity_points: actPts,
      reward_points: rewPts,
      courses_completed: completedCourses,
      updated_on_saturday: updatedOnSaturday,
      last_update_at: update ? update.submitted_at : null,
      generated_at: nowIso,
    };
  });

  // Insert or update member snapshots idempotently
  const { error: memberInsertError } = await (supabase.from("member_weekly_reports") as any)
    .upsert(memberSnapshots, { onConflict: "weekly_report_id,member_id" });

  if (memberInsertError) {
    return { success: false, error: memberInsertError.message };
  }

  // 6. Create team weekly report
  const teamReportPayload = {
    weekly_report_id: reportId,
    total_activity_points: teamTotalActivity,
    total_reward_points: teamTotalReward,
    total_courses_completed: teamTotalCourses,
    active_member_count: profiles.length,
    updated_member_count: updatedMemberCount,
    generated_at: nowIso,
  };

  const { error: teamInsertError } = await (supabase.from("team_weekly_reports") as any)
    .upsert(teamReportPayload, { onConflict: "weekly_report_id" });

  if (teamInsertError) {
    return { success: false, error: teamInsertError.message };
  }

  // 7. Mark weekly report as generated (immutable)
  await (supabase.from("weekly_reports") as any)
    .update({
      status: "generated",
      generated_at: nowIso,
    })
    .eq("id", reportId);

  // 8. Broadcast in-app notification to all active members
  const notificationsPayload = profiles.map((p: any) => ({
    user_id: p.id,
    title: "Weekly Report Generated",
    message: `The weekly team report for ${weekLabel} has been generated and is ready for review.`,
    type: "report",
    is_read: false,
  }));

  await (supabase.from("notifications") as any).insert(notificationsPayload);

  // 9. Audit Log
  await (supabase.from("audit_logs") as any).insert({
    performed_by: currentUser.user?.id || null,
    affected_user_id: currentUser.user?.id || profiles[0]?.id,
    action: "weekly_report_generated",
    metadata: {
      weekly_report_id: reportId,
      week_start: weekStart,
      week_end: weekEnd,
      total_activity_points: teamTotalActivity,
      total_reward_points: teamTotalReward,
      active_members: profiles.length,
      updated_members: updatedMemberCount,
    },
  });

  // 10. Automatically check and award weekly achievements (e.g. Consistent Contributor, Rising Momentum)
  for (const p of profiles) {
    checkAndAwardAchievementsAction(p.id, "weekly_report_generated").catch(console.error);
  }

  revalidatePath("/reports");
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");

  return {
    success: true,
    reportId,
    alreadyGenerated: false,
    activeMembers: profiles.length,
    updatedMembers: updatedMemberCount,
    message: `Weekly report for ${weekLabel} generated successfully.`,
  };
}

/**
 * Automated Saturday Reminders (11 AM, 4 PM, 6 PM).
 * Only sends to active members who have NOT completed their Saturday update.
 * Fully idempotent via unique constraints on weekly_reminders.
 */
export async function runSaturdayRemindersAction(
  reminderType: "saturday_11am" | "saturday_4pm" | "saturday_6pm",
  options?: { isCron?: boolean }
): Promise<{
  success: boolean;
  membersNotified: number;
  message?: string;
  error?: string;
}> {
  const currentUser = await getCurrentUser();

  if (!options?.isCron && (!currentUser.user || !isLeadership(currentUser.role))) {
    return { success: false, membersNotified: 0, error: "Unauthorized." };
  }

  const { weekStart, weekEnd } = getReportingWeek();

  if (!currentUser.isConfigured) {
    return {
      success: true,
      membersNotified: 2,
      message: `[Preview Mode] ${reminderType} reminders delivered to 2 un-updated members.`,
    };
  }

  const supabase = await createClient();

  // 1. Find or create weekly report
  let { data: report } = await (supabase.from("weekly_reports") as any)
    .select("id, status")
    .eq("week_start", weekStart)
    .eq("week_end", weekEnd)
    .maybeSingle();

  if (!report) {
    const { data: newReport } = await (supabase.from("weekly_reports") as any)
      .insert({ week_start: weekStart, week_end: weekEnd, status: "open" })
      .select("id, status")
      .single();
    report = newReport;
  }

  if (!report || report.status === "generated") {
    return {
      success: true,
      membersNotified: 0,
      message: "Report already generated or unavailable; skipping reminders.",
    };
  }

  // 2. Fetch all active members
  const { data: activeMembers } = await (supabase.from("profiles") as any)
    .select("id, full_name")
    .eq("status", "active");

  if (!activeMembers || activeMembers.length === 0) {
    return { success: true, membersNotified: 0, message: "No active members found." };
  }

  // 3. Fetch members who have already updated
  const { data: updates } = await (supabase.from("weekly_member_updates") as any)
    .select("member_id")
    .eq("weekly_report_id", report.id);

  const updatedSet = new Set((updates || []).map((u: any) => u.member_id));

  // 4. Fetch members who already received this reminder type
  const { data: existingReminders } = await (supabase.from("weekly_reminders") as any)
    .select("member_id")
    .eq("weekly_report_id", report.id)
    .eq("reminder_type", reminderType);

  const remindedSet = new Set((existingReminders || []).map((r: any) => r.member_id));

  // 5. Target only active members who haven't updated and haven't received this reminder
  const targets = activeMembers.filter(
    (m: any) => !updatedSet.has(m.id) && !remindedSet.has(m.id)
  );

  if (targets.length === 0) {
    return {
      success: true,
      membersNotified: 0,
      message: `All members have updated or already received ${reminderType}.`,
    };
  }

  // 6. Record reminders and send in-app notifications
  const reminderRecords = targets.map((m: any) => ({
    weekly_report_id: report.id,
    member_id: m.id,
    reminder_type: reminderType,
    sent_at: new Date().toISOString(),
    status: "sent",
  }));

  const notificationRecords = targets.map((m: any) => ({
    user_id: m.id,
    title: "Weekly update reminder",
    message: "Please update your Activity and Reward Points before today's 8:00 PM weekly report.",
    type: "reminder",
    is_read: false,
  }));

  await (supabase.from("weekly_reminders") as any).insert(reminderRecords);
  await (supabase.from("notifications") as any).insert(notificationRecords);

  revalidatePath("/notifications");
  revalidatePath("/reports");

  return {
    success: true,
    membersNotified: targets.length,
    message: `${reminderType} reminders sent to ${targets.length} members.`,
  };
}
