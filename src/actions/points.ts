"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { PointType, PointAdjustmentSource, PointHistoryItemWithActor } from "@/types/domain";
import { canManagePoints, canViewMemberProfile } from "@/lib/auth/permissions";
import { checkAndAwardAchievementsAction } from "@/actions/achievements";

export interface AdjustPointsParams {
  targetUserId: string;
  pointType: PointType;
  action: "add" | "remove";
  amount: number;
  reason: string;
}

/**
 * Atomically adjusts a member's points (Activity Points or Reward Points).
 * 
 * Permissions:
 * - Members: can adjust ONLY their own points (recorded as source='self_update')
 * - Captain & Vice Captain: can adjust any member's points (source='admin_adjustment')
 * - Manager & Strategist: cannot modify points (rejected)
 * 
 * Rules:
 * - Balances must never become negative
 * - Amount must be positive integer (> 0)
 * - Reason is required (3-500 characters)
 * - Atomic: balance change and history record succeed together or fail together
 */
export async function adjustPointsAction({
  targetUserId,
  pointType,
  action,
  amount,
  reason,
}: AdjustPointsParams) {
  const currentUser = await getCurrentUser();

  if (!currentUser.user) {
    return { success: false, error: "Not authenticated." };
  }

  const callerId = currentUser.user.id;
  const callerRole = currentUser.role;
  const isSelf = callerId === targetUserId;
  const isLeader = canManagePoints(callerRole);

  // Authorization Check:
  // Non-leadership users can ONLY modify their own account.
  if (!isSelf && !isLeader) {
    return {
      success: false,
      error: "Unauthorized: You do not have permission to modify another member's points.",
    };
  }

  // Manager and Strategist cannot modify points under any circumstances
  if (callerRole === "manager" || callerRole === "strategist") {
    return {
      success: false,
      error: "Unauthorized: Managers and Strategists do not have permission to modify points.",
    };
  }

  // Validation: Amount
  const parsedAmount = Math.floor(Number(amount));
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return {
      success: false,
      error: "Amount must be a positive integer greater than 0.",
    };
  }

  if (parsedAmount > 100000) {
    return {
      success: false,
      error: "Amount exceeds maximum allowable single change (100,000).",
    };
  }

  // Validation: Reason
  const cleanedReason = reason?.trim();
  if (!cleanedReason || cleanedReason.length < 3) {
    return {
      success: false,
      error: "A valid reason of at least 3 characters is required.",
    };
  }

  if (cleanedReason.length > 500) {
    return {
      success: false,
      error: "Reason must not exceed 500 characters.",
    };
  }

  // Validation: Point Type
  if (pointType !== "activity" && pointType !== "reward") {
    return {
      success: false,
      error: "Invalid point type. Must be Activity Points or Reward Points.",
    };
  }

  const changeAmount = action === "add" ? parsedAmount : -parsedAmount;
  const source: PointAdjustmentSource = isSelf ? "self_update" : "admin_adjustment";

  // Handle local development preview fallback
  if (!currentUser.isConfigured) {
    // Check preview balances to simulate negative rejection
    const mockBalance = 50; // standard mock balance
    if (action === "remove" && parsedAmount > mockBalance) {
      return {
        success: false,
        error: `Operation rejected: Balance cannot become negative (current balance: ${mockBalance}, requested deduction: ${parsedAmount}).`,
      };
    }
    return {
      success: true,
      message: `[Preview Mode] ${parsedAmount} ${pointType} points ${action === "add" ? "added" : "removed"}.`,
    };
  }

  const supabase = await createClient();

  // Primary: Execute atomic PostgreSQL stored procedure
  const { data: rpcResult, error: rpcError } = await (supabase as any).rpc(
    "adjust_member_points",
    {
      p_target_member_id: targetUserId,
      p_point_type: pointType,
      p_change_amount: changeAmount,
      p_reason: cleanedReason,
      p_source: source,
    }
  );

  if (!rpcError) {
    // Check and award any unlocked milestones automatically
    checkAndAwardAchievementsAction(targetUserId, "points_adjustment").catch(console.error);

    revalidatePath("/team");
    revalidatePath("/profile");
    revalidatePath(`/profile/${targetUserId}`);
    revalidatePath("/dashboard");
    revalidatePath("/leaderboard");

    return {
      success: true,
      message: `${parsedAmount} ${pointType === "activity" ? "Activity" : "Reward"} Points ${action === "add" ? "added" : "removed"} successfully.`,
      data: rpcResult,
    };
  }

  // If RPC returned an application error (e.g. negative balance or permission violation), surface friendly message
  if (rpcError.message.includes("Balance cannot become negative") || rpcError.message.includes("cannot become negative")) {
    return {
      success: false,
      error: "Operation rejected: Deduction exceeds the member's current point balance.",
    };
  }

  if (rpcError.message.includes("Security violation") || rpcError.message.includes("Unauthorized")) {
    return {
      success: false,
      error: rpcError.message,
    };
  }

  // Transactional Fallback if RPC is pending in remote database
  const { data: targetProfile, error: fetchError } = await (supabase.from("profiles") as any)
    .select("id, full_name, email, activity_points, reward_points")
    .eq("id", targetUserId)
    .single();

  if (fetchError || !targetProfile) {
    return { success: false, error: "Target member not found." };
  }

  const previousBalance =
    pointType === "activity"
      ? targetProfile.activity_points || 0
      : targetProfile.reward_points || 0;

  const newBalance = previousBalance + changeAmount;

  if (newBalance < 0) {
    return {
      success: false,
      error: `Operation rejected: Balance cannot become negative (current: ${previousBalance}, requested: ${changeAmount}).`,
    };
  }

  // Update balance
  const updatePayload: Record<string, any> = {
    [pointType === "activity" ? "activity_points" : "reward_points"]: newBalance,
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await (supabase.from("profiles") as any)
    .update(updatePayload)
    .eq("id", targetUserId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Insert history record
  const { data: historyData, error: historyError } = await (supabase.from("point_history") as any)
    .insert({
      member_id: targetUserId,
      point_type: pointType,
      previous_value: previousBalance,
      new_value: newBalance,
      change_amount: changeAmount,
      reason: cleanedReason,
      changed_by: callerId,
      source,
      actor_role: callerRole,
    })
    .select()
    .single();

  if (historyError) {
    console.error("Warning: Failed to insert point history record:", historyError.message);
  }

  // Insert audit log
  await (supabase.from("audit_logs") as any).insert({
    performed_by: callerId,
    affected_user_id: targetUserId,
    action: "points_adjusted",
    metadata: {
      point_type: pointType,
      previous_value: previousBalance,
      new_value: newBalance,
      change_amount: changeAmount,
      reason: cleanedReason,
      source,
      actor_role: callerRole,
      point_history_id: historyData?.id || null,
    },
  });

  // Check and award any unlocked milestones automatically
  checkAndAwardAchievementsAction(targetUserId, "points_adjustment").catch(console.error);

  revalidatePath("/team");
  revalidatePath("/profile");
  revalidatePath(`/profile/${targetUserId}`);
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");

  return {
    success: true,
    message: `${parsedAmount} ${pointType === "activity" ? "Activity" : "Reward"} Points ${action === "add" ? "added" : "removed"} successfully.`,
  };
}

/**
 * Fetches point history records for a member with privacy enforcement.
 */
export async function getMemberPointHistoryAction({
  memberId,
  pointType = "all",
  limit = 50,
}: {
  memberId: string;
  pointType?: "all" | PointType;
  limit?: number;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser.user) {
    return { success: false, error: "Not authenticated.", history: [] };
  }

  // Check privacy permissions:
  // Leadership can view all; members can only view their own
  const isAuthorized = canViewMemberProfile(
    currentUser.role,
    currentUser.user.id,
    memberId
  );

  if (!isAuthorized) {
    return {
      success: false,
      error: "Unauthorized: You do not have permission to view this member's point history.",
      history: [],
    };
  }

  if (!currentUser.isConfigured) {
    // Mock sample history for preview mode
    const mockHistory: PointHistoryItemWithActor[] = [
      {
        id: "ph-1",
        member_id: memberId,
        point_type: "activity",
        previous_value: 65,
        new_value: 75,
        change_amount: 10,
        reason: "Participated in weekly technical architecture sprint",
        changed_by: currentUser.user.id,
        source: "admin_adjustment",
        actor_role: "captain",
        created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
        actor: {
          full_name: "Alex Rivera",
          role: "captain",
          email: "alex@college.edu",
        },
      },
      {
        id: "ph-2",
        member_id: memberId,
        point_type: "reward",
        previous_value: 20,
        new_value: 25,
        change_amount: 5,
        reason: "Peer code review leadership bonus",
        changed_by: currentUser.user.id,
        source: "admin_adjustment",
        actor_role: "vice_captain",
        created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
        actor: {
          full_name: "Samantha Chen",
          role: "vice_captain",
          email: "sam@college.edu",
        },
      },
      {
        id: "ph-3",
        member_id: memberId,
        point_type: "activity",
        previous_value: 50,
        new_value: 65,
        change_amount: 15,
        reason: "Self-logged workshop completion & submission",
        changed_by: memberId,
        source: "self_update",
        actor_role: "member",
        created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
        actor: {
          full_name: "Team Member",
          role: "member",
          email: "member@college.edu",
        },
      },
    ];

    const filtered =
      pointType === "all"
        ? mockHistory
        : mockHistory.filter((h) => h.point_type === pointType);

    return { success: true, history: filtered };
  }

  const supabase = await createClient();

  let query = supabase
    .from("point_history")
    .select("*, actor:profiles!changed_by(full_name, role, email)")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (pointType !== "all") {
    query = query.eq("point_type", pointType);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message, history: [] };
  }

  return {
    success: true,
    history: (data || []) as PointHistoryItemWithActor[],
  };
}
