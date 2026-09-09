import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";
import { isLeadership, canViewAllReports } from "@/lib/auth/permissions";
import { getTeamTimezone } from "@/lib/config/timezone";
import { formatWeekRange } from "@/lib/date/week";
import {
  getWeeklyReportsListAction,
  getWeeklyReportDetailsAction,
  getTeamTrendsAction,
  getMemberTrendsAction,
  getSaturdayUpdateStatusAction,
} from "@/actions/reports";
import { RoleBadge } from "@/components/ui/role-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportSummaryHeader } from "@/components/reports/report-summary-header";
import { SaturdayUpdateCard } from "@/components/reports/saturday-update-card";
import { TeamTrendChart } from "@/components/reports/team-trend-chart";
import { IndividualTrendChart } from "@/components/reports/individual-trend-chart";
import { MemberReportsTable } from "@/components/reports/member-reports-table";
import { AdminSchedulerDialog } from "@/components/reports/admin-scheduler-dialog";
import {
  FileText,
  Calendar,
  Users,
  User,
  Clock,
  Shield,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface ReportsPageProps {
  searchParams?: {
    week?: string;
    member?: string;
    tab?: string;
  };
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const currentUser = await getCurrentUser();
  const callerRole = currentUser.role;
  const callerId = currentUser.user?.id || "";
  const isLeader = isLeadership(callerRole);
  const canSeeAll = canViewAllReports(callerRole);
  const teamTimezone = getTeamTimezone();

  // 1. Fetch reports list
  const { reports } = await getWeeklyReportsListAction();

  // Determine selected report
  const selectedReportId = searchParams?.week || reports[0]?.id;

  // 2. Fetch report details
  const { report } = await getWeeklyReportDetailsAction(selectedReportId);

  // 3. Fetch trends
  const { trends: teamTrends } = await getTeamTrendsAction(12);

  // Determine member for individual trends
  const targetMemberId = canSeeAll && searchParams?.member
    ? searchParams.member
    : callerId;

  const { trends: memberTrends } = await getMemberTrendsAction(targetMemberId, 12);

  // 4. Fetch Saturday check-in status
  const saturdayStatus = await getSaturdayUpdateStatusAction();

  const selectedWeekLabel = report
    ? formatWeekRange(report.week_start, report.week_end)
    : "No Reports Recorded";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Weekly Reports
            </h1>
            <RoleBadge role={callerRole} />
          </div>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Historical snapshot records, Saturday check-ins, and team momentum analytics.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 sm:pt-0 shrink-0">
          {/* Week Selector Dropdown */}
          {reports.length > 0 && (
            <div className="relative inline-block text-left">
              <div className="flex items-center gap-1.5 border border-border bg-background rounded-md px-2.5 py-1.5 text-xs shadow-sm">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                  defaultValue={selectedReportId}
                  className="bg-transparent text-foreground text-xs font-medium focus:outline-none cursor-pointer pr-1"
                  onChange={(e) => {
                    // Navigate to selected week
                    const val = e.target.value;
                    window.location.href = `/reports?week=${val}`;
                  }}
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
          )}

          {/* Admin Scheduler Controls (Captain / Vice Captain) */}
          {isLeader && (
            <AdminSchedulerDialog
              teamTimezone={teamTimezone}
              trigger={
                <Button variant="outline" size="sm" className="text-xs">
                  <Clock className="mr-1.5 h-3.5 w-3.5" />
                  Scheduler
                </Button>
              }
            />
          )}
        </div>
      </div>

      {/* Saturday Weekly Check-In Card */}
      <SaturdayUpdateCard
        initialActivityPoints={saturdayStatus.currentActivity || 0}
        initialRewardPoints={saturdayStatus.currentReward || 0}
        hasUpdated={saturdayStatus.hasUpdated}
        lastUpdateAt={saturdayStatus.update?.submitted_at}
        isLate={saturdayStatus.isLate}
        deadlinePassed={saturdayStatus.deadlinePassed}
      />

      {/* If report exists, render Summary KPIs and Detailed Views */}
      {report ? (
        <div className="space-y-6">
          {/* Report Metadata Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-muted/40 p-3 rounded-lg border border-border/70 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Active Period:</span>
              <span className="font-mono text-muted-foreground">{selectedWeekLabel}</span>
              <Badge
                variant={report.status === "generated" ? "success" : "subtle"}
                className="text-[10px] uppercase font-mono"
              >
                {report.status === "generated" ? "Finalized Snapshot" : "Open Cycle"}
              </Badge>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {report.generated_at
                ? `Generated on ${formatDateTime(report.generated_at)} (${teamTimezone})`
                : "Scheduled for 8:00 PM Saturday snapshot"}
            </div>
          </div>

          {/* KPI Summary Header */}
          <ReportSummaryHeader
            totalActivityPoints={report.team_report?.total_activity_points || 0}
            activityGrowthPct={report.activity_points_growth_percentage}
            totalRewardPoints={report.team_report?.total_reward_points || 0}
            rewardGrowthPct={report.reward_points_growth_percentage}
            updatedMembers={report.team_report?.updated_member_count || 0}
            totalActiveMembers={report.team_report?.active_member_count || 0}
            coursesCompleted={report.team_report?.total_courses_completed || 0}
          />

          {/* Trend Charts: Team Trends & Member Trends */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TeamTrendChart initialTrends={teamTrends} />
            <IndividualTrendChart initialTrends={memberTrends} />
          </div>

          {/* Member Snapshots Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  {canSeeAll ? "Member Performance Snapshots" : "My Weekly Snapshot"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {canSeeAll
                    ? "Verified member balances, Saturday update compliance, and week-over-week deltas"
                    : "Your immutable snapshot recorded for this reporting week"}
                </p>
              </div>
            </div>

            <MemberReportsTable
              memberReports={report.member_reports || []}
              isLeadershipView={canSeeAll}
            />
          </div>
        </div>
      ) : (
        <Card className="border-border">
          <CardContent className="py-12">
            <EmptyState
              icon={FileText}
              badgeText="Awaiting Reporting Cycle"
              title="No Weekly Reports Recorded"
              description="Weekly reports will appear here automatically every Saturday at 8:00 PM once reporting cycles commence."
              className="border-dashed"
            />
          </CardContent>
        </Card>
      )}

      {/* Snapshot Integrity & Audit Compliance */}
      <div className="rounded-xl border border-border/70 bg-card/60 backdrop-blur-sm p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-primary/10 text-primary">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Automated Reporting &amp; Snapshot Integrity
            </h4>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Sunday-to-Saturday reporting cycles with automated reminder notifications, weekly Saturday updates, and immutable 8:00 PM snapshots in {teamTimezone}.
            </p>
          </div>
        </div>
        <Badge variant="subtle" className="text-[11px] shrink-0 font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
          Audit Compliant
        </Badge>
      </div>
    </div>
  );
}
