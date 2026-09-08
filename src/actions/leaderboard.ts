"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import {
  LeaderboardCategory,
  LeaderboardEntry,
  LeaderboardPeriod,
  PersonalRankSummary,
  Profile,
} from "@/types/domain";
import {
  calculateOverallPerformanceScore,
  rankMembers,
  UnrankedMember,
} from "@/lib/scoring/performance";
import { getReportingWeek, getPreviousWeekRange } from "@/lib/date/week";

interface GetLeaderboardParams {
  category?: LeaderboardCategory;
  period?: LeaderboardPeriod;
}

/**
 * Retrieves the ranked leaderboard of active members for a given category and period.
 * Strictly enforces deterministic ranking, real database metrics, and explicit fallback behavior.
 */
export async function getLeaderboardAction(params: GetLeaderboardParams = {}) {
  const category: LeaderboardCategory = params.category || "overall";
  const period: LeaderboardPeriod = params.period || "all_time";

  const supabase = await createClient();

  // 1. Fetch all active members
  const { data: activeProfiles, error: profileErr } = await (supabase.from("profiles") as any)
    .select("id, full_name, role, status, avatar_url, activity_points, reward_points")
    .eq("status", "active");

  if (profileErr) {
    console.error("Error fetching leaderboard profiles:", profileErr);
    return { success: false, error: profileErr.message, entries: [], category, period };
  }

  const profiles: Profile[] = activeProfiles || [];
  if (profiles.length === 0) {
    return { success: true, entries: [], category, period, totalActive: 0 };
  }

  const memberIds = profiles.map((p) => p.id);

  // 2. Fetch completed courses count per member
  const { data: courseData } = await (supabase.from("member_courses") as any)
    .select("member_id")
    .eq("status", "completed")
    .in("member_id", memberIds);

  const coursesCountMap = new Map<string, number>();
  for (const c of courseData || []) {
    coursesCountMap.set(c.member_id, (coursesCountMap.get(c.member_id) || 0) + 1);
  }

  // 3. Fetch completed goals count per member
  const { data: goalData } = await (supabase.from("goals") as any)
    .select("target_member_id")
    .eq("status", "completed")
    .in("target_member_id", memberIds);

  const goalsCountMap = new Map<string, number>();
  for (const g of goalData || []) {
    if (g.target_member_id) {
      goalsCountMap.set(g.target_member_id, (goalsCountMap.get(g.target_member_id) || 0) + 1);
    }
  }

  // 4. Fetch earned achievements and count per member
  const { data: memberAchData } = await (supabase.from("member_achievements") as any)
    .select("member_id, achievements(*)")
    .in("member_id", memberIds);

  const achievementsMap = new Map<string, any[]>();
  for (const item of memberAchData || []) {
    if (item.achievements) {
      const list = achievementsMap.get(item.member_id) || [];
      list.push(item.achievements);
      achievementsMap.set(item.member_id, list);
    }
  }

  // 5. Handle Time Periods: All Time vs Current Week vs Previous Week
  const unrankedList: UnrankedMember[] = [];

  if (period === "previous_week") {
    // PREVIOUS WEEK: Strictly queried from stored historical snapshots in member_weekly_reports
    const { weekStart: curWeekStart } = getReportingWeek();
    const prevWeek = getPreviousWeekRange(curWeekStart);

    // Find the previous week's report header
    const { data: prevReportHeader } = await (supabase.from("weekly_reports") as any)
      .select("id")
      .eq("week_start", prevWeek.weekStart)
      .eq("week_end", prevWeek.weekEnd)
      .maybeSingle();

    let historicalMemberReports: any[] = [];
    if (prevReportHeader) {
      const { data: mReports } = await (supabase.from("member_weekly_reports") as any)
        .select("member_id, activity_points, reward_points, completed_courses_count")
        .eq("weekly_report_id", prevReportHeader.id);
      historicalMemberReports = mReports || [];
    }

    const histMap = new Map<string, any>();
    for (const hr of historicalMemberReports) {
      histMap.set(hr.member_id, hr);
    }

    for (const p of profiles) {
      const hist = histMap.get(p.id);
      const actPts = hist ? hist.activity_points : 0;
      const rewPts = hist ? hist.reward_points : 0;
      const coursesCount = hist ? hist.completed_courses_count : coursesCountMap.get(p.id) || 0;

      unrankedList.push({
        member_id: p.id,
        full_name: p.full_name,
        role: p.role,
        avatar_url: p.avatar_url,
        status: p.status,
        activity_points: actPts,
        reward_points: rewPts,
        completed_courses_count: coursesCount,
        completed_goals_count: goalsCountMap.get(p.id) || 0,
        weekly_improvement_delta: 0,
        earned_achievements_count: (achievementsMap.get(p.id) || []).length,
      });
    }
  } else if (period === "current_week") {
    // CURRENT WEEK: Active week's updates & point gains
    const { weekStart } = getReportingWeek();

    // Check for submitted Saturday updates for current week
    const { data: updatesData } = await (supabase.from("weekly_member_updates") as any)
      .select("member_id, activity_points, reward_points")
      .in("member_id", memberIds);

    const updateMap = new Map<string, any>();
    for (const u of updatesData || []) {
      updateMap.set(u.member_id, u);
    }

    // Previous week reports for delta
    const prevWeek = getPreviousWeekRange(weekStart);
    const { data: prevReportHeader } = await (supabase.from("weekly_reports") as any)
      .select("id")
      .eq("week_start", prevWeek.weekStart)
      .maybeSingle();

    let priorReportsMap = new Map<string, any>();
    if (prevReportHeader) {
      const { data: pReports } = await (supabase.from("member_weekly_reports") as any)
        .select("member_id, activity_points, reward_points")
        .eq("weekly_report_id", prevReportHeader.id);
      for (const pr of pReports || []) {
        priorReportsMap.set(pr.member_id, pr);
      }
    }

    for (const p of profiles) {
      const upd = updateMap.get(p.id);
      const prior = priorReportsMap.get(p.id);

      // Current week points
      const actPts = upd ? upd.activity_points : p.activity_points;
      const rewPts = upd ? upd.reward_points : p.reward_points;

      // Delta compared to prior week snapshot
      let delta = 0;
      if (prior) {
        const priorTotal = (prior.activity_points || 0) + (prior.reward_points || 0);
        delta = Math.max(0, actPts + rewPts - priorTotal);
      }

      unrankedList.push({
        member_id: p.id,
        full_name: p.full_name,
        role: p.role,
        avatar_url: p.avatar_url,
        status: p.status,
        activity_points: actPts,
        reward_points: rewPts,
        completed_courses_count: coursesCountMap.get(p.id) || 0,
        completed_goals_count: goalsCountMap.get(p.id) || 0,
        weekly_improvement_delta: delta,
        earned_achievements_count: (achievementsMap.get(p.id) || []).length,
      });
    }
  } else {
    // ALL TIME: Current live balances from profiles
    // Fetch last 2 reports for each member to evaluate improvement delta
    for (const p of profiles) {
      const { data: reports } = await (supabase.from("member_weekly_reports") as any)
        .select("activity_points, reward_points, created_at")
        .eq("member_id", p.id)
        .order("created_at", { ascending: false })
        .limit(2);

      let delta = 0;
      if (reports && reports.length >= 2) {
        const latestTotal = (reports[0].activity_points || 0) + (reports[0].reward_points || 0);
        const priorTotal = (reports[1].activity_points || 0) + (reports[1].reward_points || 0);
        delta = Math.max(0, latestTotal - priorTotal);
      }

      unrankedList.push({
        member_id: p.id,
        full_name: p.full_name,
        role: p.role,
        avatar_url: p.avatar_url,
        status: p.status,
        activity_points: p.activity_points || 0,
        reward_points: p.reward_points || 0,
        completed_courses_count: coursesCountMap.get(p.id) || 0,
        completed_goals_count: goalsCountMap.get(p.id) || 0,
        weekly_improvement_delta: delta,
        earned_achievements_count: (achievementsMap.get(p.id) || []).length,
      });
    }
  }

  // 6. Rank deterministically
  const rankedEntries = rankMembers(unrankedList, category);

  // 7. Attach achievements preview list
  const entriesWithBadges: LeaderboardEntry[] = rankedEntries.map((e) => ({
    ...e,
    earned_achievements: achievementsMap.get(e.member_id) || [],
  }));

  return {
    success: true,
    entries: entriesWithBadges,
    category,
    period,
    totalActive: entriesWithBadges.length,
  };
}

/**
 * Retrieves personal ranking summary for the currently authenticated member.
 */
export async function getPersonalRankAction(): Promise<{
  success: boolean;
  personalRank: PersonalRankSummary | null;
}> {
  const currentUser = await getCurrentUser();
  if (!currentUser.user || !currentUser.profile) {
    return { success: false, personalRank: null };
  }

  const memberId = currentUser.user.id;

  // Retrieve All Time leaderboards for each category
  const [overallRes, activityRes, rewardRes] = await Promise.all([
    getLeaderboardAction({ category: "overall", period: "all_time" }),
    getLeaderboardAction({ category: "activity", period: "all_time" }),
    getLeaderboardAction({ category: "reward", period: "all_time" }),
  ]);

  const overallEntries = overallRes.entries || [];
  const activityEntries = activityRes.entries || [];
  const rewardEntries = rewardRes.entries || [];

  const overallEntry = overallEntries.find((e) => e.member_id === memberId);
  const activityEntry = activityEntries.find((e) => e.member_id === memberId);
  const rewardEntry = rewardEntries.find((e) => e.member_id === memberId);

  const totalActive = overallEntries.length;

  return {
    success: true,
    personalRank: {
      overall_rank: overallEntry ? overallEntry.rank : null,
      activity_rank: activityEntry ? activityEntry.rank : null,
      reward_rank: rewardEntry ? rewardEntry.rank : null,
      total_active_members: totalActive,
      overall_score: overallEntry ? overallEntry.overall_score : 0,
      activity_points: currentUser.profile.activity_points || 0,
      reward_points: currentUser.profile.reward_points || 0,
    },
  };
}
