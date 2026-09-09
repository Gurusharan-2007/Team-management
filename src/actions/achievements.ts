"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import {
  Achievement,
  AchievementType,
  AchievementWithStatus,
  MemberAchievement,
} from "@/types/domain";
import { isLeadership } from "@/lib/auth/permissions";

export interface CreateAchievementParams {
  name: string;
  description: string;
  icon?: string;
  achievementType: AchievementType;
  threshold: number;
  active?: boolean;
}

export interface UpdateAchievementParams {
  id: string;
  name: string;
  description: string;
  icon?: string;
  achievementType: AchievementType;
  threshold: number;
  active: boolean;
}

/**
 * Retrieves the full achievements catalog, populated with the user's progress and earned status.
 */
export async function getAchievementsCatalogAction(targetMemberId?: string) {
  const currentUser = await getCurrentUser();
  const supabase = await createClient();

  const memberId = targetMemberId || currentUser.user?.id;

  // 1. Fetch all achievements (leadership sees inactive ones too, others see active only)
  let query = (supabase.from("achievements") as any).select("*").order("threshold", { ascending: true });
  if (!isLeadership(currentUser.role)) {
    query = query.eq("active", true);
  }

  const { data: achievementsData, error: achError } = await query;
  if (achError) {
    console.error("Error fetching achievements catalog:", achError);
    return { success: false, error: achError.message, catalog: [] };
  }

  const catalog: Achievement[] = achievementsData || [];

  // If no member context is available, return catalog with zero progress
  if (!memberId) {
    const defaultCatalog: AchievementWithStatus[] = catalog.map((ach) => ({
      ...ach,
      is_earned: false,
      current_value: 0,
      progress_percentage: 0,
    }));
    return { success: true, catalog: defaultCatalog };
  }

  // 2. Fetch member's earned achievements
  const { data: earnedData } = await (supabase.from("member_achievements") as any)
    .select("achievement_id, awarded_at, metadata")
    .eq("member_id", memberId);

  const earnedMap = new Map<string, { awarded_at: string; metadata: any }>();
  if (earnedData) {
    for (const item of earnedData) {
      earnedMap.set(item.achievement_id, {
        awarded_at: item.awarded_at,
        metadata: item.metadata,
      });
    }
  }

  // 3. Gather metric values for progress calculation
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("activity_points, reward_points")
    .eq("id", memberId)
    .maybeSingle();

  const { count: completedCoursesCount } = await (supabase.from("member_courses") as any)
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId);

  const { count: completedGoalsCount } = await (supabase.from("goals") as any)
    .select("id", { count: "exact", head: true })
    .eq("target_member_id", memberId)
    .eq("status", "completed");

  const { count: weeklyUpdatesCount } = await (supabase.from("weekly_member_updates") as any)
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId);

  // Improvement metric: compare last 2 weekly reports
  const { data: reports } = await (supabase.from("member_weekly_reports") as any)
    .select("activity_points, reward_points, created_at")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(2);

  let weeklyImprovementDelta = 0;
  if (reports && reports.length >= 2) {
    const latestTotal = (reports[0].activity_points || 0) + (reports[0].reward_points || 0);
    const priorTotal = (reports[1].activity_points || 0) + (reports[1].reward_points || 0);
    weeklyImprovementDelta = Math.max(0, latestTotal - priorTotal);
  }

  const actPts = profile?.activity_points || 0;
  const rewPts = profile?.reward_points || 0;
  const coursesCount = completedCoursesCount || 0;
  const goalsCount = completedGoalsCount || 0;
  const updatesCount = weeklyUpdatesCount || 0;

  const catalogWithStatus: AchievementWithStatus[] = catalog.map((ach) => {
    const earned = earnedMap.get(ach.id);
    let currentValue = 0;

    switch (ach.achievement_type) {
      case "activity_points":
        currentValue = actPts;
        break;
      case "reward_points":
        currentValue = rewPts;
        break;
      case "courses_completed":
        currentValue = coursesCount;
        break;
      case "goal_completed":
        currentValue = goalsCount;
        break;
      case "weekly_updates":
        currentValue = updatesCount;
        break;
      case "improvement":
        currentValue = weeklyImprovementDelta;
        break;
    }

    const progressPercentage =
      ach.threshold > 0 ? Math.min(100, Math.round((currentValue / ach.threshold) * 100)) : 100;

    const qualifies = Boolean(ach.active && (ach.threshold <= 0 || currentValue >= ach.threshold));

    return {
      ...ach,
      is_earned: qualifies,
      awarded_at: qualifies ? (earned?.awarded_at || new Date().toISOString()) : null,
      current_value: currentValue,
      progress_percentage: progressPercentage,
      metadata: earned?.metadata,
    };
  });

  return { success: true, catalog: catalogWithStatus };
}

/**
 * Retrieves earned achievements for a member.
 */
export async function getMemberEarnedAchievementsAction(memberId: string) {
  const supabase = await createClient();

  const { data, error } = await (supabase.from("member_achievements") as any)
    .select("id, member_id, achievement_id, awarded_at, metadata, achievements(*)")
    .eq("member_id", memberId)
    .order("awarded_at", { ascending: false });

  if (error) {
    console.error("Error fetching member achievements:", error);
    return { success: false, error: error.message, achievements: [] };
  }

  return {
    success: true,
    achievements: data || [],
  };
}

/**
 * AUTOMATIC EVENT-DRIVEN ACHIEVEMENT EVALUATOR
 *
 * Idempotently evaluates whether a member has unlocked any milestone achievements.
 * Triggered automatically upon:
 *   - Point adjustments
 *   - Course completions
 *   - Goal completions
 *   - Saturday weekly updates
 *   - Weekly report generation
 *
 * NOTE: Strictly NO arbitrary manual award option is provided.
 */
export async function checkAndAwardAchievementsAction(
  memberId: string,
  triggerSource: string
) {
  if (!memberId) return { success: false, newlyAwarded: [] };

  const supabase = await createClient();

  // 1. Fetch active achievements
  const { data: activeAchievements, error: achErr } = await (supabase.from("achievements") as any)
    .select("*")
    .eq("active", true);

  if (achErr || !activeAchievements || activeAchievements.length === 0) {
    return { success: true, newlyAwarded: [] };
  }

  // 2. Fetch already earned achievements for this member to prevent duplicate awards
  const { data: existingAwards } = await (supabase.from("member_achievements") as any)
    .select("achievement_id")
    .eq("member_id", memberId);

  const earnedIds = new Set<string>((existingAwards || []).map((a: any) => a.achievement_id));

  // Filter for achievements not yet unlocked
  const unearned = (activeAchievements as Achievement[]).filter((a) => !earnedIds.has(a.id));
  if (unearned.length === 0) {
    return { success: true, newlyAwarded: [] };
  }

  // 3. Fetch member's current metrics
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("full_name, activity_points, reward_points")
    .eq("id", memberId)
    .maybeSingle();

  const actPts = profile?.activity_points || 0;
  const rewPts = profile?.reward_points || 0;

  // Completed courses
  const { count: coursesCount } = await (supabase.from("member_courses") as any)
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId);

  // Completed goals
  const { count: goalsCount } = await (supabase.from("goals") as any)
    .select("id", { count: "exact", head: true })
    .eq("target_member_id", memberId)
    .eq("status", "completed");

  // Submitted weekly updates
  const { count: updatesCount } = await (supabase.from("weekly_member_updates") as any)
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId);

  // Weekly improvement delta (compare last 2 weekly reports)
  const { data: reports } = await (supabase.from("member_weekly_reports") as any)
    .select("activity_points, reward_points, created_at")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(2);

  let weeklyImprovementDelta = 0;
  if (reports && reports.length >= 2) {
    const latestTotal = (reports[0].activity_points || 0) + (reports[0].reward_points || 0);
    const priorTotal = (reports[1].activity_points || 0) + (reports[1].reward_points || 0);
    weeklyImprovementDelta = Math.max(0, latestTotal - priorTotal);
  }

  const newlyAwarded: Achievement[] = [];

  // 4. Check each unearned achievement against qualifying metric
  for (const ach of unearned) {
    let qualifies = false;
    let metricValue = 0;

    switch (ach.achievement_type) {
      case "activity_points":
        metricValue = actPts;
        qualifies = actPts >= ach.threshold;
        break;
      case "reward_points":
        metricValue = rewPts;
        qualifies = rewPts >= ach.threshold;
        break;
      case "courses_completed":
        metricValue = coursesCount || 0;
        qualifies = (coursesCount || 0) >= ach.threshold;
        break;
      case "goal_completed":
        metricValue = goalsCount || 0;
        qualifies = (goalsCount || 0) >= ach.threshold;
        break;
      case "weekly_updates":
        metricValue = updatesCount || 0;
        qualifies = (updatesCount || 0) >= ach.threshold;
        break;
      case "improvement":
        metricValue = weeklyImprovementDelta;
        qualifies = weeklyImprovementDelta >= ach.threshold;
        break;
    }

    if (qualifies) {
      // Award achievement
      const { error: insertErr } = await (supabase.from("member_achievements") as any).insert({
        member_id: memberId,
        achievement_id: ach.id,
        metadata: {
          trigger_source: triggerSource,
          metric_value: metricValue,
          threshold: ach.threshold,
          awarded_at: new Date().toISOString(),
        },
      });

      if (!insertErr) {
        newlyAwarded.push(ach);

        // Send in-app notification
        await (supabase.from("notifications") as any).insert({
          user_id: memberId,
          type: "achievement",
          title: `Milestone Unlocked: ${ach.name}`,
          message: `Congratulations! You unlocked the "${ach.name}" achievement: ${ach.description}`,
          is_read: false,
        });

        // Record audit log
        await (supabase.from("audit_logs") as any).insert({
          action: "achievement_awarded",
          affected_user_id: memberId,
          metadata: {
            achievement_id: ach.id,
            achievement_name: ach.name,
            trigger_source: triggerSource,
            metric_value: metricValue,
          },
        });
      }
    }
  }

  if (newlyAwarded.length > 0) {
    revalidatePath("/leaderboard");
    revalidatePath("/profile");
    revalidatePath(`/profile/${memberId}`);
    revalidatePath("/notifications");
  }

  return { success: true, newlyAwarded };
}

/**
 * CAPTAIN & VICE CAPTAIN MANAGEMENT: Create a new achievement definition
 */
export async function createAchievementAction(params: CreateAchievementParams) {
  const currentUser = await getCurrentUser();

  if (!currentUser.user || !isLeadership(currentUser.role)) {
    return {
      success: false,
      error: "Unauthorized: Only Captain and Vice Captain can manage achievements.",
    };
  }

  const name = params.name?.trim();
  if (!name || name.length < 3 || name.length > 60) {
    return { success: false, error: "Achievement name must be between 3 and 60 characters." };
  }

  const description = params.description?.trim();
  if (!description || description.length < 5 || description.length > 255) {
    return { success: false, error: "Description must be between 5 and 255 characters." };
  }

  const threshold = Math.floor(Number(params.threshold));
  if (isNaN(threshold) || threshold < 0) {
    return { success: false, error: "Threshold must be a non-negative number." };
  }

  const supabase = await createClient();

  const { data, error } = await (supabase.from("achievements") as any)
    .insert({
      name,
      description,
      icon: params.icon || "award",
      achievement_type: params.achievementType,
      threshold,
      active: params.active ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating achievement:", error);
    return { success: false, error: error.message };
  }

  // Audit log
  await (supabase.from("audit_logs") as any).insert({
    performed_by: currentUser.user.id,
    action: "achievement_created",
    metadata: {
      achievement_id: data.id,
      name: data.name,
      achievement_type: data.achievement_type,
      threshold: data.threshold,
    },
  });

  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/team");
  return { success: true, achievement: data };
}

/**
 * CAPTAIN & VICE CAPTAIN MANAGEMENT: Update an existing achievement definition
 */
export async function updateAchievementAction(params: UpdateAchievementParams) {
  const currentUser = await getCurrentUser();

  if (!currentUser.user || !isLeadership(currentUser.role)) {
    return {
      success: false,
      error: "Unauthorized: Only Captain and Vice Captain can manage achievements.",
    };
  }

  const name = params.name?.trim();
  if (!name || name.length < 3 || name.length > 60) {
    return { success: false, error: "Achievement name must be between 3 and 60 characters." };
  }

  const description = params.description?.trim();
  if (!description || description.length < 5 || description.length > 255) {
    return { success: false, error: "Description must be between 5 and 255 characters." };
  }

  const threshold = Math.floor(Number(params.threshold));
  if (isNaN(threshold) || threshold < 0) {
    return { success: false, error: "Threshold must be a non-negative number." };
  }

  const supabase = await createClient();

  const { data, error } = await (supabase.from("achievements") as any)
    .update({
      name,
      description,
      icon: params.icon || "award",
      achievement_type: params.achievementType,
      threshold,
      active: params.active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating achievement:", error);
    return { success: false, error: error.message };
  }

  // Audit log
  await (supabase.from("audit_logs") as any).insert({
    performed_by: currentUser.user.id,
    action: "achievement_updated",
    metadata: {
      achievement_id: data.id,
      name: data.name,
      active: data.active,
    },
  });

  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/team");
  return { success: true, achievement: data };
}

/**
 * CAPTAIN & VICE CAPTAIN MANAGEMENT: Toggle active/inactive status
 */
export async function toggleAchievementStatusAction(achievementId: string, active: boolean) {
  const currentUser = await getCurrentUser();

  if (!currentUser.user || !isLeadership(currentUser.role)) {
    return {
      success: false,
      error: "Unauthorized: Only Captain and Vice Captain can toggle achievements.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await (supabase.from("achievements") as any)
    .update({
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", achievementId)
    .select()
    .single();

  if (error) {
    console.error("Error toggling achievement status:", error);
    return { success: false, error: error.message };
  }

  // Audit log
  await (supabase.from("audit_logs") as any).insert({
    performed_by: currentUser.user.id,
    action: active ? "achievement_updated" : "achievement_deactivated",
    metadata: {
      achievement_id: data.id,
      name: data.name,
      active,
    },
  });

  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/team");
  return { success: true, achievement: data };
}
