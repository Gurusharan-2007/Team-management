import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canViewAllReports } from "@/lib/auth/permissions";
import { getPreviousWeekRange, formatWeekRange } from "@/lib/date/week";
import { getTeamTimezone } from "@/lib/config/timezone";
import { generateWeeklyReportPdf, PdfReportData } from "@/lib/reports/pdf-generator";
import { WeeklyReport, TeamWeeklyReport, MemberWeeklyReport } from "@/types/domain";

export const dynamic = "force-dynamic";

function formatFilenameDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    const monthShort = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(d);
    const dayPadded = String(day).padStart(2, "0");
    return `${monthShort}-${dayPadded}-${year}`;
  } catch {
    return dateStr;
  }
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    // Enforce authentication
    if (!currentUser.user) {
      return NextResponse.json(
        { error: "Authentication required to download weekly reports." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get("reportId") || searchParams.get("id");
    const weekParam = searchParams.get("week") || searchParams.get("weekStart");

    if (!reportId && !weekParam) {
      return NextResponse.json(
        { error: "Missing required parameter: provide either 'reportId' or 'week'." },
        { status: 400 }
      );
    }

    const callerRole = currentUser.role;
    const callerId = currentUser.user.id;
    const isLeader = canViewAllReports(callerRole);
    const teamTimezone = getTeamTimezone();

    // Check if running in mock / preview mode
    if (!currentUser.isConfigured) {
      // In local preview mode without database connection
      const targetId = reportId || "rep-w2";
      const isW2 = targetId === "rep-w2" || weekParam === "2026-08-30";

      if (targetId === "rep-w3" || weekParam === "2026-09-06") {
        return NextResponse.json(
          { error: "The requested weekly report has not been finalized yet. Open cycles cannot be exported." },
          { status: 400 }
        );
      }

      const mockWeekStart = isW2 ? "2026-08-30" : "2026-08-23";
      const mockWeekEnd = isW2 ? "2026-09-05" : "2026-08-29";

      const mockTeamReport = {
        total_activity_points: isW2 ? 460 : 324,
        total_reward_points: isW2 ? 145 : 122,
        total_courses_completed: isW2 ? 5 : 4,
        active_member_count: 5,
        updated_member_count: 5,
        generated_at: isW2 ? "2026-09-05T20:00:00Z" : "2026-08-29T20:00:00Z",
      };

      const mockPrevTeam = isW2
        ? {
            total_activity_points: 324,
            total_reward_points: 122,
            total_courses_completed: 4,
            active_member_count: 5,
            updated_member_count: 4,
          }
        : null;

      const mockAllMembers = [
        {
          member_id: "usr-cap",
          full_name: "Alex Rivera",
          email: "alex.rivera@team.internal",
          role: "captain",
          activity_points: isW2 ? 120 : 90,
          reward_points: isW2 ? 45 : 35,
          courses_completed: 2,
          updated_on_saturday: true,
          last_update_at: isW2 ? "2026-09-05T14:30:00Z" : "2026-08-29T15:00:00Z",
          previous_activity_points: isW2 ? 90 : null,
          previous_reward_points: isW2 ? 35 : null,
          activity_change: isW2 ? 30 : null,
          reward_change: isW2 ? 10 : null,
        },
        {
          member_id: "usr-vc",
          full_name: "Jordan Lee",
          email: "jordan.lee@team.internal",
          role: "vice_captain",
          activity_points: isW2 ? 95 : 75,
          reward_points: isW2 ? 30 : 25,
          courses_completed: 1,
          updated_on_saturday: true,
          last_update_at: isW2 ? "2026-09-05T16:15:00Z" : "2026-08-29T16:10:00Z",
          previous_activity_points: isW2 ? 75 : null,
          previous_reward_points: isW2 ? 25 : null,
          activity_change: isW2 ? 20 : null,
          reward_change: isW2 ? 5 : null,
        },
        {
          member_id: "usr-m1",
          full_name: "Taylor Swift",
          email: "taylor.s@team.internal",
          role: "member",
          activity_points: isW2 ? 75 : 45,
          reward_points: isW2 ? 10 : 10,
          courses_completed: 1,
          updated_on_saturday: true,
          last_update_at: isW2 ? "2026-09-05T17:42:00Z" : null,
          previous_activity_points: isW2 ? 45 : null,
          previous_reward_points: isW2 ? 10 : null,
          activity_change: isW2 ? 30 : null,
          reward_change: isW2 ? 0 : null,
        },
      ];

      // Privacy enforcement before PDF generator
      const permittedMockMembers = isLeader
        ? mockAllMembers
        : mockAllMembers.filter((m) => m.member_id === callerId || m.role === callerRole);

      const pdfData: PdfReportData = {
        report: {
          id: targetId,
          week_start: mockWeekStart,
          week_end: mockWeekEnd,
          status: "generated",
          generated_at: isW2 ? "2026-09-05T20:00:00Z" : "2026-08-29T20:00:00Z",
        },
        weekLabel: formatWeekRange(mockWeekStart, mockWeekEnd),
        teamTimezone,
        teamReport: mockTeamReport,
        previousTeamReport: mockPrevTeam,
        memberReports: permittedMockMembers,
        teamTrends: [
          {
            week_start: "2026-08-16",
            week_end: "2026-08-22",
            week_label: "Aug 16 – Aug 22",
            activity_points: 210,
            reward_points: 90,
            updated_member_count: 4,
            courses_completed: 2,
          },
          {
            week_start: "2026-08-23",
            week_end: "2026-08-29",
            week_label: "Aug 23 – Aug 29",
            activity_points: 324,
            reward_points: 122,
            updated_member_count: 4,
            courses_completed: 4,
          },
          {
            week_start: "2026-08-30",
            week_end: "2026-09-05",
            week_label: "Aug 30 – Sep 5",
            activity_points: 460,
            reward_points: 145,
            updated_member_count: 5,
            courses_completed: 5,
          },
        ],
        isLeadershipView: isLeader,
      };

      const pdfBytes = await generateWeeklyReportPdf(pdfData);
      const filename = `Team-Portal-Weekly-Report-${mockWeekStart}-to-${mockWeekEnd}.pdf`;

      return new Response(Buffer.from(pdfBytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      });
    }

    // Connect to database
    const hasPrivilegedKey = Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ADMIN_KEY
    );
    const supabase: any = hasPrivilegedKey ? createAdminClient() : await createClient();

    // 1. Resolve exact requested report (Requirement 1: Never silently substitute)
    let reportQuery = supabase.from("weekly_reports").select("*");
    if (reportId) {
      reportQuery = reportQuery.eq("id", reportId);
    } else if (weekParam) {
      reportQuery = reportQuery.eq("week_start", weekParam);
    }

    const { data: reportData, error: reportErr } = await reportQuery.maybeSingle();

    if (reportErr || !reportData) {
      return NextResponse.json(
        { error: "No finalized weekly report found matching the requested period." },
        { status: 404 }
      );
    }

    const report = reportData as WeeklyReport;

    // Requirement 1: Verify report is finalized
    if (report.status !== "generated") {
      return NextResponse.json(
        {
          error: "The requested weekly report has not been finalized yet. Only finalized snapshot records can be downloaded.",
        },
        { status: 400 }
      );
    }

    // 2. Fetch immutable team weekly report snapshot (Requirement 2)
    const { data: teamReportData } = await supabase
      .from("team_weekly_reports")
      .select("*")
      .eq("weekly_report_id", report.id)
      .maybeSingle();

    const teamReport = teamReportData as TeamWeeklyReport | null;

    // 3. Fetch member weekly reports with profile metadata (Requirement 2)
    const { data: rawMemberReports } = await supabase
      .from("member_weekly_reports")
      .select("*, member:profiles!member_id(full_name, email, role)")
      .eq("weekly_report_id", report.id);

    // 4. Fetch previous week's finalized report for exact deltas (Requirement 3)
    const { weekStart: prevWeekStart } = getPreviousWeekRange(report.week_start);
    const { data: prevReportData } = await supabase
      .from("weekly_reports")
      .select("id")
      .eq("week_start", prevWeekStart)
      .eq("status", "generated")
      .maybeSingle();

    let prevTeamReport: TeamWeeklyReport | null = null;
    const prevMemberMap = new Map<string, MemberWeeklyReport>();

    if (prevReportData) {
      const { data: pTeam } = await supabase
        .from("team_weekly_reports")
        .select("*")
        .eq("weekly_report_id", prevReportData.id)
        .maybeSingle();
      prevTeamReport = pTeam || null;

      const { data: pMembers } = await supabase
        .from("member_weekly_reports")
        .select("*")
        .eq("weekly_report_id", prevReportData.id);

      if (pMembers) {
        pMembers.forEach((pm: MemberWeeklyReport) => prevMemberMap.set(pm.member_id, pm));
      }
    }

    // 5. Build member reports with exact calculated deltas
    const allMemberSnapshots = (rawMemberReports || []).map((mr: any) => {
      const prev = prevMemberMap.get(mr.member_id);
      const prevAct = prev ? prev.activity_points : null;
      const prevRew = prev ? prev.reward_points : null;

      return {
        member_id: mr.member_id,
        full_name: mr.member?.full_name || "Team Member",
        email: mr.member?.email || "",
        role: mr.member?.role || "member",
        activity_points: mr.activity_points,
        reward_points: mr.reward_points,
        courses_completed: mr.courses_completed,
        updated_on_saturday: mr.updated_on_saturday,
        last_update_at: mr.last_update_at,
        previous_activity_points: prevAct,
        previous_reward_points: prevRew,
        activity_change: prevAct !== null ? mr.activity_points - prevAct : null,
        reward_change: prevRew !== null ? mr.reward_points - prevRew : null,
      };
    });

    // Requirement 5: STRICT ROLE-BASED PRIVACY ENFORCEMENT BEFORE PDF GENERATION
    // Leadership: full roster
    // Standard member: strictly only their own snapshot
    const permittedMembers = isLeader
      ? allMemberSnapshots
      : allMemberSnapshots.filter((m: any) => m.member_id === callerId);

    // 6. Fetch historical trends (up to 12 weeks of finalized snapshots)
    const { data: trendSnapshots } = await supabase
      .from("team_weekly_reports")
      .select("*, weekly_report:weekly_reports!weekly_report_id(week_start, week_end, status)")
      .order("created_at", { ascending: false })
      .limit(12);

    const teamTrends = (trendSnapshots || [])
      .filter((s: any) => s.weekly_report?.status === "generated")
      .map((s: any) => ({
        week_start: s.weekly_report.week_start,
        week_end: s.weekly_report.week_end,
        week_label: formatWeekRange(s.weekly_report.week_start, s.weekly_report.week_end),
        activity_points: s.total_activity_points || 0,
        reward_points: s.total_reward_points || 0,
        updated_member_count: s.updated_member_count,
        courses_completed: s.total_courses_completed,
      }))
      .reverse();

    // 7. Assemble PDF generator payload
    const pdfData: PdfReportData = {
      report: {
        id: report.id,
        week_start: report.week_start,
        week_end: report.week_end,
        status: report.status,
        generated_at: report.generated_at,
      },
      weekLabel: formatWeekRange(report.week_start, report.week_end),
      teamTimezone,
      teamReport,
      previousTeamReport: prevTeamReport,
      memberReports: permittedMembers,
      teamTrends,
      isLeadershipView: isLeader,
    };

    const pdfBytes = await generateWeeklyReportPdf(pdfData);
    const filename = `Team-Portal-Weekly-Report-${report.week_start}-to-${report.week_end}.pdf`;

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("[DownloadReportPdf] Error generating report PDF:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while generating the weekly report PDF." },
      { status: 500 }
    );
  }
}
