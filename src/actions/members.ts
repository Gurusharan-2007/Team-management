"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { UserRole, UserStatus, ALL_ROLES, Profile } from "@/types/domain";
import { canManageMembers, canManageRoles } from "@/lib/auth/permissions";

/**
 * Updates a member's role.
 * Strictly enforced: Only Captain and Vice Captain may invoke this.
 * Protected against demoting the last active Captain.
 */
export async function updateMemberRoleAction({
  targetUserId,
  newRole,
}: {
  targetUserId: string;
  newRole: UserRole;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser.user || !canManageRoles(currentUser.role)) {
    return {
      success: false,
      error: "Unauthorized: Only Captain and Vice Captain can assign or change roles.",
    };
  }

  if (!ALL_ROLES.includes(newRole)) {
    return {
      success: false,
      error: `Invalid role specified: ${newRole}`,
    };
  }

  // Handle local development preview fallback
  if (!currentUser.isConfigured) {
    return {
      success: true,
      message: `[Preview Mode] Role updated to ${newRole}`,
    };
  }

  const supabase = await createClient();

  // Retrieve target member details
  const { data, error: fetchError } = await supabase
    .from("profiles")
    .select("role, status, email")
    .eq("id", targetUserId)
    .single();

  const targetProfile = data as { role: UserRole; status: UserStatus; email: string } | null;

  if (fetchError || !targetProfile) {
    return { success: false, error: "Target member profile not found." };
  }

  // Prevent demoting the last active captain
  if (targetProfile.role === "captain" && newRole !== "captain") {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "captain")
      .eq("status", "active");

    if (count !== null && count <= 1) {
      return {
        success: false,
        error: "Operation rejected: Cannot demote the last active Captain in the organization.",
      };
    }
  }

  // Perform role update
  const { error: updateError } = await (supabase.from("profiles") as any)
    .update({
      role: newRole,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetUserId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Log to audit trail
  await (supabase.from("audit_logs") as any).insert({
    performed_by: currentUser.user.id,
    affected_user_id: targetUserId,
    action: "role_changed",
    metadata: {
      previous_role: targetProfile.role,
      new_role: newRole,
      target_email: targetProfile.email,
    },
  });

  revalidatePath("/team");
  revalidatePath("/dashboard");
  revalidatePath(`/profile/${targetUserId}`);

  return { success: true };
}

/**
 * Toggles a member's active / inactive status (Soft Deactivation).
 * Preserves all historical records, weekly report snapshots, and point logs.
 */
export async function toggleMemberStatusAction({
  targetUserId,
  status,
}: {
  targetUserId: string;
  status: UserStatus;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser.user || !canManageMembers(currentUser.role)) {
    return {
      success: false,
      error: "Unauthorized: Only Captain and Vice Captain can deactivate or activate members.",
    };
  }

  if (currentUser.user.id === targetUserId && status === "inactive") {
    return {
      success: false,
      error: "You cannot deactivate your own account.",
    };
  }

  if (!currentUser.isConfigured) {
    return {
      success: true,
      message: `[Preview Mode] Member status set to ${status}`,
    };
  }

  const supabase = await createClient();

  const { data, error: fetchError } = await supabase
    .from("profiles")
    .select("role, status, email")
    .eq("id", targetUserId)
    .single();

  const targetProfile = data as { role: UserRole; status: UserStatus; email: string } | null;

  if (fetchError || !targetProfile) {
    return { success: false, error: "Target member not found." };
  }

  // Protect the last active captain from deactivation
  if (targetProfile.role === "captain" && status === "inactive") {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "captain")
      .eq("status", "active");

    if (count !== null && count <= 1) {
      return {
        success: false,
        error: "Operation rejected: Cannot deactivate the last active Captain.",
      };
    }
  }

  const { error: updateError } = await (supabase.from("profiles") as any)
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetUserId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Audit log
  await (supabase.from("audit_logs") as any).insert({
    performed_by: currentUser.user.id,
    affected_user_id: targetUserId,
    action: status === "inactive" ? "member_deactivated" : "member_activated",
    metadata: {
      previous_status: targetProfile.status,
      new_status: status,
      target_email: targetProfile.email,
    },
  });

  revalidatePath("/team");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Updates basic member information (e.g. full_name).
 * Allowed for the user themselves or Captain/Vice Captain.
 */
export async function updateMemberInfoAction({
  targetUserId,
  fullName,
  avatarUrl,
  bio,
  githubUsername,
  linkedinUrl,
}: {
  targetUserId: string;
  fullName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  githubUsername?: string | null;
  linkedinUrl?: string | null;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser.user) {
    return { success: false, error: "Not authenticated." };
  }

  const isSelf = currentUser.user.id === targetUserId;
  const isLeader = canManageMembers(currentUser.role);

  if (!isSelf && !isLeader) {
    return {
      success: false,
      error: "Unauthorized: You do not have permission to edit this member.",
    };
  }

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  const updatedFields: string[] = [];

  if (fullName !== undefined) {
    const cleanedName = fullName.trim();
    if (cleanedName.length < 2 || cleanedName.length > 100) {
      return {
        success: false,
        error: "Full name must be between 2 and 100 characters.",
      };
    }
    updates.full_name = cleanedName;
    updatedFields.push("full_name");
  }

  if (avatarUrl !== undefined) {
    if (avatarUrl && avatarUrl.trim().length > 500) {
      return {
        success: false,
        error: "Avatar URL must be under 500 characters.",
      };
    }
    updates.avatar_url = avatarUrl ? avatarUrl.trim() : null;
    updatedFields.push("avatar_url");
  }

  if (bio !== undefined) {
    if (bio && bio.trim().length > 1000) {
      return {
        success: false,
        error: "Bio must be under 1000 characters.",
      };
    }
    updates.bio = bio ? bio.trim() : null;
    updatedFields.push("bio");
  }

  if (githubUsername !== undefined) {
    updates.github_username = githubUsername ? githubUsername.trim() : null;
    updatedFields.push("github_username");
  }

  if (linkedinUrl !== undefined) {
    updates.linkedin_url = linkedinUrl ? linkedinUrl.trim() : null;
    updatedFields.push("linkedin_url");
  }

  if (updatedFields.length === 0) {
    return { success: true };
  }

  if (!currentUser.isConfigured) {
    return { success: true, message: "[Preview Mode] Profile updated." };
  }

  const supabase = await createClient();

  const { error: updateError } = await (supabase.from("profiles") as any)
    .update(updates)
    .eq("id", targetUserId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  if (!isSelf) {
    await (supabase.from("audit_logs") as any).insert({
      performed_by: currentUser.user.id,
      affected_user_id: targetUserId,
      action: "member_updated",
      metadata: { updated_fields: updatedFields, ...updates },
    });
  }

  revalidatePath("/team");
  revalidatePath("/profile");
  revalidatePath(`/profile/${targetUserId}`);

  return { success: true };
}

/**
 * Bootstraps the initial Captain account.
 * Only succeeds if ZERO captains currently exist in the database.
 */
export async function bootstrapCaptainAction({
  targetEmail,
}: {
  targetEmail: string;
}) {
  const supabase = await createClient();

  // Check if any captain already exists
  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "captain");

  if (count !== null && count > 0) {
    return {
      success: false,
      error: "A Captain is already designated. Use standard team role management.",
    };
  }

  const { error } = await (supabase as any).rpc("bootstrap_initial_captain", {
    target_email: targetEmail,
  });

  if (error) {
    // Fallback direct update if RPC is pending
    const { data: updated, error: directError } = await (supabase.from("profiles") as any)
      .update({ role: "captain", status: "active" })
      .eq("email", targetEmail)
      .select();

    if (directError || !updated || updated.length === 0) {
      return {
        success: false,
        error: "Target user must register an account first before being designated Captain.",
      };
    }
  }

  revalidatePath("/team");
  revalidatePath("/dashboard");

  return { success: true };
}
