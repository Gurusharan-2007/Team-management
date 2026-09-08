"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { Course, CourseStatus } from "@/types/domain";
import { canManageMembers } from "@/lib/auth/permissions";
import { checkAndAwardAchievementsAction } from "@/actions/achievements";

/**
 * Toggles technical course completion for a specific member.
 * Allowed for:
 * - The member themself (self-management)
 * - Captain and Vice Captain (managing any member's courses)
 * 
 * STRICT RULE: No completion dates stored in database or metadata.
 */
export async function toggleCourseCompletionAction({
  targetMemberId,
  courseId,
  completed,
}: {
  targetMemberId: string;
  courseId: string;
  completed: boolean;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser.user) {
    return { success: false, error: "Not authenticated." };
  }

  const isSelf = currentUser.user.id === targetMemberId;
  const isLeader = canManageMembers(currentUser.role);

  if (!isSelf && !isLeader) {
    return {
      success: false,
      error: "Unauthorized: You do not have permission to manage this member's courses.",
    };
  }

  if (!currentUser.isConfigured) {
    return {
      success: true,
      message: `[Preview Mode] Course completion toggled to ${completed}.`,
    };
  }

  const supabase = await createClient();

  if (completed) {
    // Insert completion (record that member completed it)
    const { error: insertError } = await (supabase.from("member_courses") as any).upsert(
      {
        member_id: targetMemberId,
        course_id: courseId,
      },
      { onConflict: "member_id,course_id" }
    );

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Log to audit trail
    await (supabase.from("audit_logs") as any).insert({
      performed_by: currentUser.user.id,
      affected_user_id: targetMemberId,
      action: "course_completed",
      metadata: { course_id: courseId },
    });

    // Check and award any unlocked milestone achievements automatically
    checkAndAwardAchievementsAction(targetMemberId, "course_completion").catch(console.error);
  } else {
    // Remove completion
    const { error: deleteError } = await supabase
      .from("member_courses")
      .delete()
      .eq("member_id", targetMemberId)
      .eq("course_id", courseId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // Log to audit trail
    await (supabase.from("audit_logs") as any).insert({
      performed_by: currentUser.user.id,
      affected_user_id: targetMemberId,
      action: "course_uncompleted",
      metadata: { course_id: courseId },
    });
  }

  revalidatePath("/profile");
  revalidatePath(`/profile/${targetMemberId}`);
  revalidatePath("/team");
  revalidatePath("/leaderboard");

  return { success: true };
}

/**
 * Creates a new technical course in the catalog.
 * Strictly restricted to Captain and Vice Captain.
 */
export async function createCourseAction({
  name,
  description,
}: {
  name: string;
  description?: string;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser.user || !canManageMembers(currentUser.role)) {
    return {
      success: false,
      error: "Unauthorized: Only Captain and Vice Captain can create courses.",
    };
  }

  const cleanedName = name.trim();
  if (cleanedName.length < 2 || cleanedName.length > 100) {
    return {
      success: false,
      error: "Course name must be between 2 and 100 characters.",
    };
  }

  const cleanedDescription = description ? description.trim() : null;

  if (!currentUser.isConfigured) {
    return {
      success: true,
      message: `[Preview Mode] Course "${cleanedName}" created.`,
    };
  }

  const supabase = await createClient();

  const { data, error } = await (supabase.from("courses") as any)
    .insert({
      name: cleanedName,
      description: cleanedDescription,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await (supabase.from("audit_logs") as any).insert({
    performed_by: currentUser.user.id,
    affected_user_id: currentUser.user.id,
    action: "course_created",
    metadata: { course_id: data.id, course_name: cleanedName },
  });

  revalidatePath("/profile");
  revalidatePath("/team");

  return { success: true, course: data as Course };
}

/**
 * Updates an existing technical course in the catalog.
 * Strictly restricted to Captain and Vice Captain.
 */
export async function updateCourseAction({
  courseId,
  name,
  description,
  status,
}: {
  courseId: string;
  name: string;
  description?: string;
  status?: CourseStatus;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser.user || !canManageMembers(currentUser.role)) {
    return {
      success: false,
      error: "Unauthorized: Only Captain and Vice Captain can edit courses.",
    };
  }

  const cleanedName = name.trim();
  if (cleanedName.length < 2 || cleanedName.length > 100) {
    return {
      success: false,
      error: "Course name must be between 2 and 100 characters.",
    };
  }

  const updates: Record<string, any> = {
    name: cleanedName,
    description: description ? description.trim() : null,
  };

  if (status) {
    updates.status = status;
  }

  if (!currentUser.isConfigured) {
    return { success: true, message: `[Preview Mode] Course updated.` };
  }

  const supabase = await createClient();

  const { error } = await (supabase.from("courses") as any)
    .update(updates)
    .eq("id", courseId);

  if (error) {
    return { success: false, error: error.message };
  }

  await (supabase.from("audit_logs") as any).insert({
    performed_by: currentUser.user.id,
    affected_user_id: currentUser.user.id,
    action: "course_updated",
    metadata: { course_id: courseId, updates },
  });

  revalidatePath("/profile");
  revalidatePath("/team");

  return { success: true };
}

/**
 * Deactivates (archives) or reactivates a technical course.
 * Archiving preserves past completion records for members.
 * Strictly restricted to Captain and Vice Captain.
 */
export async function toggleCourseStatusAction({
  courseId,
  status,
}: {
  courseId: string;
  status: CourseStatus;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser.user || !canManageMembers(currentUser.role)) {
    return {
      success: false,
      error: "Unauthorized: Only Captain and Vice Captain can toggle course status.",
    };
  }

  if (!currentUser.isConfigured) {
    return { success: true, message: `[Preview Mode] Course status updated to ${status}.` };
  }

  const supabase = await createClient();

  const { error } = await (supabase.from("courses") as any)
    .update({ status })
    .eq("id", courseId);

  if (error) {
    return { success: false, error: error.message };
  }

  await (supabase.from("audit_logs") as any).insert({
    performed_by: currentUser.user.id,
    affected_user_id: currentUser.user.id,
    action: status === "archived" ? "course_deactivated" : "course_updated",
    metadata: { course_id: courseId, new_status: status },
  });

  revalidatePath("/profile");
  revalidatePath("/team");

  return { success: true };
}
