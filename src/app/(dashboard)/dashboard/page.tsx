import Link from "next/link";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { isLeadership } from "@/lib/auth/permissions";
import { FuturisticHero } from "@/components/dashboard/futuristic-hero";
import { QuickActionsPanel } from "@/components/dashboard/quick-actions-panel";
import { FuturisticMetricCards } from "@/components/dashboard/futuristic-metric-cards";
import { FuturisticTrendsChart } from "@/components/dashboard/futuristic-trends-chart";
import { FuturisticTopPerformers } from "@/components/dashboard/futuristic-top-performers";
import { FuturisticRecentActivity } from "@/components/dashboard/futuristic-recent-activity";
import { FuturisticAchievementsTile } from "@/components/dashboard/futuristic-achievements-tile";
import { FuturisticInspirationCard } from "@/components/dashboard/futuristic-inspiration-card";
import { FuturisticNotificationsCard } from "@/components/dashboard/futuristic-notifications-card";
import { FuturisticNextSteps } from "@/components/dashboard/futuristic-next-steps";
import { getGoalsWithProgressAction } from "@/actions/goals";
import { getWeeklyReportsListAction, getWeeklyReportDetailsAction, getTeamTrendsAction } from "@/actions/reports";
import { getPersonalRankAction } from "@/actions/leaderboard";
import { getAchievementsCatalogAction } from "@/actions/achievements";
import { getNotificationsAction } from "@/actions/notifications";
import { formatWeekRange } from "@/lib/date/week";
import { PointHistoryItemWithActor, UserRole, Profile } from "@/types/domain";

export default async function DashboardPage() {
  const currentUser = await getCurrentUser();
  const userName = currentUser.profile?.full_name || "Team Member";
  const userRole = currentUser.role || ("member" as UserRole);
  const canManage = userRole === "captain" || userRole === "vice_captain";

  let totalMembers = 0;
  let activeMemberCount = 0;
  let totalTeamActivityPoints = 0;
  let totalTeamRewardPoints = 0;
  let totalCoursesCompleted = 0;
  let userCoursesCompleted = 0;

  let allMembers: any[] = [];
  let recentPointEvents: PointHistoryItemWithActor[] = [];

  // 1. Fetch domain data concurrently
  const [goalsResult, trendsResult, rankResult, achievementsResult, reportsResult, notifsResult] =
    await Promise.all([
      getGoalsWithProgressAction(),
      getTeamTrendsAction(8),
      getPersonalRankAction(),
      getAchievementsCatalogAction(currentUser.user?.id),
      getWeeklyReportsListAction(),
      getNotificationsAction("all"),
    ]);

  const goals = goalsResult.goals || [];
  const teamTrends = trendsResult.trends || [];
  const personalRank = rankResult.personalRank || null;
  const achievements = achievementsResult.catalog || [];
  const weeklyReports = reportsResult.reports || [];
  const notifications = notifsResult.notifications || [];

  if (currentUser.isConfigured) {
    try {
      const supabase = await createClient();

      // Fetch all profiles to compute team totals and rankings
      const { data: profiles } = await (supabase.from("profiles") as any)
        .select("id, full_name, email, role, status, activity_points, reward_points, avatar_url");

      if (profiles && profiles.length > 0) {
        allMembers = profiles;
        totalMembers = profiles.length;
        const active = profiles.filter((p: any) => p.status === "active");
        activeMemberCount = active.length;

        // Points accounting: Total Team Points counts points from active members only
        totalTeamActivityPoints = active.reduce(
          (acc: number, p: any) => acc + (p.activity_points || 0),
          0
        );
        totalTeamRewardPoints = active.reduce(
          (acc: number, p: any) => acc + (p.reward_points || 0),
          0
        );
      }

      // Fetch completed technical courses count
      const { data: coursesData } = await (supabase.from("member_courses") as any)
        .select("id, member_id");

      if (coursesData) {
        totalCoursesCompleted = coursesData.length;

        if (currentUser.user) {
          userCoursesCompleted = (coursesData as any[]).filter(
            (c) => c.member_id === currentUser.user!.id
          ).length;
        }
      }

      // Fetch recent point events for audit trail
      const { data: pointsData } = await supabase
        .from("point_history")
        .select("*, actor:profiles!changed_by(full_name, role, email)")
        .order("created_at", { ascending: false })
        .limit(5);

      if (pointsData) {
        recentPointEvents = pointsData as PointHistoryItemWithActor[];
      }
    } catch {
      // Handled gracefully via empty states
    }
  }

  let activityGrowthPct: number | null = null;
  let rewardGrowthPct: number | null = null;

  if (weeklyReports.length > 0) {
    const { report } = await getWeeklyReportDetailsAction(weeklyReports[0].id);
    if (report) {
      activityGrowthPct = report.activity_points_growth_percentage ?? null;
      rewardGrowthPct = report.reward_points_growth_percentage ?? null;
    }
  }

  return (
    <div className="space-y-6 sm:space-y-7 pb-8">
      {/* 2-Column Master Layout matching Reference Image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* CENTER-LEFT PRIMARY COLUMN (Cols 1-8 / ~67-70% width)                    */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Panoramic Mountain Sunrise Hero Banner */}
          <FuturisticHero
            userName={userName}
            userRole={userRole}
            activeMemberCount={activeMemberCount}
            teamTotalPoints={totalTeamActivityPoints + totalTeamRewardPoints}
            currentRank={personalRank?.overall_rank || null}
          />

          {/* 2. 4 Metric Cards Row (Activity, Reward, Courses, Rank) */}
          <FuturisticMetricCards
            activityPoints={totalTeamActivityPoints}
            activityGrowthPct={activityGrowthPct}
            rewardPoints={totalTeamRewardPoints}
            rewardGrowthPct={rewardGrowthPct}
            coursesCompleted={totalCoursesCompleted}
            currentRank={personalRank?.overall_rank || null}
          />

          {/* 3. Middle Analytics Row: Activity & Reward Trends (7 cols) + Top Performers (5 cols) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            <div className="md:col-span-7 flex">
              <div className="w-full">
                <FuturisticTrendsChart
                  initialTrends={teamTrends}
                  currentWeekActivity={totalTeamActivityPoints}
                  currentWeekReward={totalTeamRewardPoints}
                />
              </div>
            </div>

            <div className="md:col-span-5 flex">
              <div className="w-full">
                <FuturisticTopPerformers members={allMembers} />
              </div>
            </div>
          </div>

          {/* 4. Bottom Row: Recent Activity & Milestones (7 cols) + Inspiration Card (5 cols) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            <div className="md:col-span-7 flex">
              <div className="w-full">
                <FuturisticRecentActivity
                  pointEvents={recentPointEvents}
                  achievements={achievements}
                />
              </div>
            </div>

            <div className="md:col-span-5 flex">
              <div className="w-full">
                <FuturisticInspirationCard />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT RAIL COLUMN (Cols 9-12 / ~30-33% width)                             */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Quick Actions (Top of Right Rail) */}
          <QuickActionsPanel canManage={canManage} />

          {/* 2. Notifications Card (Middle of Right Rail) */}
          <FuturisticNotificationsCard notifications={notifications} />

          {/* 3. Next Steps / Goals Card (Bottom of Right Rail) */}
          <FuturisticNextSteps goals={goals} />
        </div>
      </div>
    </div>
  );
}
