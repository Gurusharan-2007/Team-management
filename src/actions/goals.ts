"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import {
  Goal,
  GoalScope,
  GoalStatus,
  GoalWithProgress,
  PointType,
  UserRole,
} from "@/types/domain";
import { isLeadership } from "@/lib/auth/permissions";
import { checkAndAwardAchievementsAction } from "@/actions/achievements";

interface CreateGoalParams {
  title: string;
  description?: string;
  pointType: PointType;
  targetPoints: number;
  scope: GoalScope;
  targetMemberId?: string;
  targetDate?: string;
}

interface UpdateGoalParams {
  goalId: string;
  title: string;
  description?: string;
  pointType: PointType;
  targetPoints: number;
  scope: GoalScope;
  targetMemberId?: string;
  status?: GoalStatus;
  targetDate?: string;
}

/**
 * Creates a new target/goal (Team or Individual).
 * Strictly restricted to Captain and Vice Captain.
 */
export async function createGoalAction(params: CreateGoalParams) {
  const currentUser = await getCurrentUser();

  if (!currentUser.user || !isLeadership(currentUser.role)) {
    return {
      success: false,
      error: "Unauthorized: Only Captain and Vice Captain can create goals.",
    };
  }

  const cleanedTitle = params.title?.trim();
  if (!cleanedTitle || cleanedTitle.length < 3 || cleanedTitle.length > 100) {
    return {
      success: false,
      error: "Goal title must be between 3 and 100 characters.",
    };
  }

  const parsedTarget = Math.floor(Number(params.targetPoints));
  if (isNaN(parsedTarget) || parsedTarget <= 0) {
    return {
      success: false,
      error: "Target points must be a positive integer greater than 0.",
    };
  }

  if (params.scope === "individual" && !params.targetMemberId) {
    return {
      success: false,
      error: "An assigned member must be selected for individual targets.",
    };
  }

  if (!currentUser.isConfigured) {
    return {
      success: true,
      message: `[Preview Mode] Goal "${cleanedTitle}" created.`,
    };
  }

  const supabase = await createClient();

  const insertPayload: Record<string, any> = {
    title: cleanedTitle,
    description: params.description?.trim() || null,
    point_type: params.pointType,
    target_points: parsedTarget,
    scope: params.scope,
    target_member_id: params.scope === "individual" ? params.targetMemberId : null,
    created_by: currentUser.user.id,
    status: "active",
    target_date: params.targetDate || null,
  };

  const { data: newGoal, error: insertError } = await (supabase.from("goals") as any)
    .insert(insertPayload)
    .select()
    .single();

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  // Audit log
  await (supabase.from("audit_logs") as any).insert({
    performed_by: currentUser.user.id,
    affected_user_id: params.scope === "individual" && params.targetMemberId ? params.targetMemberId : currentUser.user.id,
    action: "goal_created",
    metadata: {
      goal_id: newGoal.id,
      title: cleanedTitle,
      point_type: params.pointType,
      target_points: parsedTarget,
      scope: params.scope,
      target_member_id: params.targetMemberId || null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return { success: true, goal: newGoal as Goal };
}

/**
 * Updates an existing goal.
 * Strictly restricted to Captain and Vice Captain.
 */
export async function updateGoalAction(params: UpdateGoalParams) {
  const currentUser = await getCurrentUser();

  if (!currentUser.user || !isLeadership(currentUser.role)) {
    return {
      success: false,
      error: "Unauthorized: Only Captain and Vice Captain can update goals.",
    };
  }

  const cleanedTitle = params.title?.trim();
  if (!cleanedTitle || cleanedTitle.length < 3 || cleanedTitle.length > 100) {
    return {
      success: false,
      error: "Goal title must be between 3 and 100 characters.",
    };
  }

  const parsedTarget = Math.floor(Number(params.targetPoints));
  if (isNaN(parsedTarget) || parsedTarget <= 0) {
    return {
      success: false,
      error: "Target points must be a positive integer greater than 0.",
    };
  }

  if (params.scope === "individual" && !params.targetMemberId) {
    return {
      success: false,
      error: "An assigned member must be selected for individual targets.",
    };
  }

  if (!currentUser.isConfigured) {
    return { success: true, message: "[Preview Mode] Goal updated." };
  }

  const supabase = await createClient();

  const updatePayload: Record<string, any> = {
    title: cleanedTitle,
    description: params.description?.trim() || null,
    point_type: params.pointType,
    target_points: parsedTarget,
    scope: params.scope,
    target_member_id: params.scope === "individual" ? params.targetMemberId : null,
    target_date: params.targetDate || null,
    updated_at: new Date().toISOString(),
  };

  if (params.status) {
    updatePayload.status = params.status;
  }

  const { error: updateError } = await (supabase.from("goals") as any)
    .update(updatePayload)
    .eq("id", params.goalId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Audit log
  await (supabase.from("audit_logs") as any).insert({
    performed_by: currentUser.user.id,
    affected_user_id: params.targetMemberId || currentUser.user.id,
    action: "goal_updated",
    metadata: {
      goal_id: params.goalId,
      updates: updatePayload,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return { success: true };
}

/**
 * Toggles goal status (e.g. active, completed, archived).
 * Strictly restricted to Captain and Vice Captain.
 */
export async function toggleGoalStatusAction({
  goalId,
  status,
}: {
  goalId: string;
  status: GoalStatus;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser.user || !isLeadership(currentUser.role)) {
    return {
      success: false,
      error: "Unauthorized: Only Captain and Vice Captain can toggle goal status.",
    };
  }

  if (!currentUser.isConfigured) {
    return { success: true, message: `[Preview Mode] Goal status set to ${status}.` };
  }

  const supabase = await createClient();

  const { error: updateError } = await (supabase.from("goals") as any)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", goalId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  await (supabase.from("audit_logs") as any).insert({
    performed_by: currentUser.user.id,
    affected_user_id: currentUser.user.id,
    action: status === "archived" ? "goal_deactivated" : "goal_updated",
    metadata: { goal_id: goalId, new_status: status },
  });

  if (status === "completed") {
    // Fetch the goal to see who achieved it
    const { data: goal } = await (supabase.from("goals") as any)
      .select("scope, target_member_id")
      .eq("id", goalId)
      .maybeSingle();

    if (goal) {
      if (goal.scope === "individual" && goal.target_member_id) {
        checkAndAwardAchievementsAction(goal.target_member_id, "goal_completion").catch(console.error);
      } else if (goal.scope === "team") {
        const { data: activeProfiles } = await (supabase.from("profiles") as any)
          .select("id")
          .eq("status", "active");
        for (const p of activeProfiles || []) {
          checkAndAwardAchievementsAction(p.id, "goal_completion").catch(console.error);
        }
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/leaderboard");

  return { success: true };
}

/**
 * Fetches goals with calculated progress based on current real database point balances.
 * Filters by caller permissions:
 * - Leadership (Captain, Vice Captain, Manager, Strategist): all goals
 * - Members: team goals AND individual goals assigned to caller
 */
export async function getGoalsWithProgressAction({
  includeArchived = false,
}: {
  includeArchived?: boolean;
} = {}): Promise<{ success: boolean; goals: GoalWithProgress[]; error?: string }> {
  const currentUser = await getCurrentUser();

  if (!currentUser.user) {
    return { success: false, goals: [], error: "Not authenticated." };
  }

  const callerId = currentUser.user.id;
  const callerRole = currentUser.role;
  const isLeader =
    callerRole === "captain" ||
    callerRole === "vice_captain" ||
    callerRole === "manager" ||
    callerRole === "strategist";

  if (!currentUser.isConfigured) {
    // Fallback seed goals for preview mode
    const mockGoals: GoalWithProgress[] = [
      {
        id: "goal-1",
        title: "Sprint Technical Milestones",
        description: "Team task completions and repository code reviews",
        target_points: 500,
        point_type: "activity",
        scope: "team",
        target_member_id: null,
        created_by: "cap-1",
        target_date: null,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        current_points: 460,
        progress_percentage: 92,
        is_completed: false,
      },
      {
        id: "goal-2",
        title: "Leadership Recognition Target",
        description: "Peer mentorship and team collaboration awards",
        target_points: 150,
        point_type: "reward",
        scope: "team",
        target_member_id: null,
        created_by: "cap-1",
        target_date: null,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        current_points: 145,
        progress_percentage: 97,
        is_completed: false,
      },
      {
        id: "goal-3",
        title: "Personal Contribution Milestone",
        description: "Individual task submissions for the current term",
        target_points: 100,
        point_type: "activity",
        scope: "individual",
        target_member_id: callerId,
        created_by: "cap-1",
        target_date: null,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        current_points: currentUser.profile?.activity_points || 75,
        progress_percentage: Math.min(100, Math.round(((currentUser.profile?.activity_points || 75) / 100) * 100)),
        is_completed: false,
      },
    ];

    return { success: true, goals: mockGoals };
  }

  const supabase = await createClient();

  // 1. Fetch active profiles to compute team totals and individual balances
  const { data: profilesData } = await (supabase.from("profiles") as any)
    .select("id, full_name, email, role, status, activity_points, reward_points");

  const profiles = (profilesData || []) as any[];
  const activeProfiles = profiles.filter((p) => p.status === "active");

  const teamTotalActivity = activeProfiles.reduce((acc, p) => acc + (p.activity_points || 0), 0);
  const teamTotalReward = activeProfiles.reduce((acc, p) => acc + (p.reward_points || 0), 0);

  const profileMap = new Map<string, any>();
  profiles.forEach((p) => profileMap.set(p.id, p));

  // 2. Fetch goals
  let query = (supabase.from("goals") as any)
    .select("*, target_member:profiles!target_member_id(full_name, email, role)")
    .order("created_at", { ascending: true });

  if (!includeArchived) {
    query = query.in("status", ["active", "in_progress", "completed"]);
  }

  // If member, apply RLS-compliant filter
  if (!isLeader) {
    query = query.or(`scope.eq.team,target_member_id.eq.${callerId}`);
  }

  const { data: rawGoals, error: goalsError } = await query;

  if (goalsError) {
    return { success: false, goals: [], error: goalsError.message };
  }

  // 3. Compute progress dynamically from real current database point balances
  const processedGoals: GoalWithProgress[] = (rawGoals || []).map((goal: any) => {
    let currentPoints = 0;

    if (goal.scope === "team") {
      currentPoints = goal.point_type === "activity" ? teamTotalActivity : teamTotalReward;
    } else {
      // Individual goal
      const targetProfile = goal.target_member_id ? profileMap.get(goal.target_member_id) : null;
      if (targetProfile) {
        currentPoints =
          goal.point_type === "activity"
            ? targetProfile.activity_points || 0
            : targetProfile.reward_points || 0;
      }
    }

    const progressPercentage = Math.min(
      100,
      Math.round((currentPoints / (goal.target_points || 1)) * 100)
    );
    const isCompleted = currentPoints >= goal.target_points;

    return {
      ...(goal as Goal),
      current_points: currentPoints,
      progress_percentage: progressPercentage,
      is_completed: isCompleted,
      target_member: goal.target_member || null,
    };
  });

  return { success: true, goals: processedGoals };
}
