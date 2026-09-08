"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { Notification } from "@/types/domain";

export async function getNotificationsAction(
  filter: "all" | "unread" | "reminder" | "report" = "all"
): Promise<{ success: boolean; notifications: Notification[]; unreadCount: number }> {
  const currentUser = await getCurrentUser();

  if (!currentUser.user) {
    return { success: false, notifications: [], unreadCount: 0 };
  }

  const userId = currentUser.user.id;

  if (!currentUser.isConfigured) {
    const mockNotifs: Notification[] = [
      {
        id: "notif-1",
        user_id: userId,
        title: "Weekly update reminder",
        message: "Please update your Activity and Reward Points before today's 8:00 PM weekly report.",
        type: "reminder",
        is_read: false,
        action_url: "/reports",
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "notif-2",
        user_id: userId,
        title: "Weekly Report Generated",
        message: "The weekly team report for Aug 30 – Sep 5, 2026 has been generated.",
        type: "report",
        is_read: true,
        action_url: "/reports",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: "notif-3",
        user_id: userId,
        title: "Goal Milestone Reached",
        message: "Team sprint milestone reached: 460 / 500 Activity Points achieved.",
        type: "system",
        is_read: false,
        action_url: "/dashboard",
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      },
      {
        id: "notif-4",
        user_id: userId,
        title: "Achievement Unlocked!",
        message: "You've earned the 'Consistent Contributor' badge for submitting weekly updates on time.",
        type: "achievement",
        is_read: false,
        action_url: "/leaderboard",
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
    ];

    let filtered = mockNotifs;
    if (filter === "unread") filtered = mockNotifs.filter((n) => !n.is_read);
    else if (filter === "reminder") filtered = mockNotifs.filter((n) => n.type === "reminder");
    else if (filter === "report") filtered = mockNotifs.filter((n) => n.type === "report");

    const unread = mockNotifs.filter((n) => !n.is_read).length;
    return { success: true, notifications: filtered, unreadCount: unread };
  }

  const supabase = await createClient();

  let query = (supabase.from("notifications") as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (filter === "unread") {
    query = query.eq("is_read", false);
  } else if (filter === "reminder") {
    query = query.eq("type", "reminder");
  } else if (filter === "report") {
    query = query.eq("type", "report");
  }

  const { data: notifications, error } = await query;

  if (error) {
    return { success: false, notifications: [], unreadCount: 0 };
  }

  // Count unread
  const { count } = await (supabase.from("notifications") as any)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return {
    success: true,
    notifications: (notifications || []) as Notification[],
    unreadCount: count || 0,
  };
}

export async function markNotificationAsReadAction(notificationId: string) {
  const currentUser = await getCurrentUser();

  if (!currentUser.user) {
    return { success: false, error: "Not authenticated." };
  }

  if (!currentUser.isConfigured) {
    return { success: true };
  }

  const supabase = await createClient();

  const { error } = await (supabase.from("notifications") as any)
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", currentUser.user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllNotificationsAsReadAction() {
  const currentUser = await getCurrentUser();

  if (!currentUser.user) {
    return { success: false, error: "Not authenticated." };
  }

  if (!currentUser.isConfigured) {
    return { success: true };
  }

  const supabase = await createClient();

  const { error } = await (supabase.from("notifications") as any)
    .update({ is_read: true })
    .eq("user_id", currentUser.user.id)
    .eq("is_read", false);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/notifications");
  return { success: true };
}

export async function getUnreadNotificationCountAction(): Promise<number> {
  const currentUser = await getCurrentUser();

  if (!currentUser.user) return 0;
  if (!currentUser.isConfigured) return 1; // 1 mock unread for preview

  try {
    const supabase = await createClient();
    const { count } = await (supabase.from("notifications") as any)
      .select("*", { count: "exact", head: true })
      .eq("user_id", currentUser.user.id)
      .eq("is_read", false);

    return count || 0;
  } catch {
    return 0;
  }
}
