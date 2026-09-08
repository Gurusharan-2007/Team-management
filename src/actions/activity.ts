"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { AuditLogWithActor, TimelineFilterCategory } from "@/types/domain";
import { canViewActivityTimeline } from "@/lib/auth/permissions";

const CATEGORY_ACTION_MAP: Record<Exclude<TimelineFilterCategory, "all">, string[]> = {
  points: ["points_adjusted"],
  courses: [
    "course_created",
    "course_updated",
    "course_deactivated",
    "course_completed",
    "course_uncompleted",
  ],
  goals: ["goal_created", "goal_updated", "goal_deactivated"],
  achievements: ["achievement_unlocked"],
  members: [
    "member_created",
    "member_updated",
    "member_activated",
    "member_deactivated",
    "role_changed",
  ],
  reports: [
    "report_submitted",
    "report_approved",
    "report_rejected",
    "weekly_report_generated",
  ],
  settings: ["settings_updated", "invitation_created", "invitation_revoked", "member_exported"],
};

const MOCK_ACTIVITY_LOGS: AuditLogWithActor[] = [
  {
    id: "log-1",
    performed_by: "captain-1",
    affected_user_id: "member-1",
    action: "points_adjusted",
    metadata: {
      point_type: "activity",
      amount: 15,
      reason: "Lead robotics hardware workshop and documented schematics",
    },
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    actor: {
      full_name: "Aarav Sharma",
      role: "captain",
      email: "aarav@apexteam.edu",
    },
    target_profile: {
      full_name: "Rahul Verma",
      role: "member",
      email: "rahul@apexteam.edu",
    },
  },
  {
    id: "log-2",
    performed_by: "vice-captain-1",
    affected_user_id: "member-2",
    action: "achievement_unlocked",
    metadata: {
      achievement_title: "Consistent Contributor",
      achievement_badge: "award",
      tier: "gold",
    },
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    actor: {
      full_name: "Diya Patel",
      role: "vice_captain",
      email: "diya@apexteam.edu",
    },
    target_profile: {
      full_name: "Ananya Iyer",
      role: "member",
      email: "ananya@apexteam.edu",
    },
  },
  {
    id: "log-3",
    performed_by: "captain-1",
    affected_user_id: null,
    action: "course_created",
    metadata: {
      course_title: "Embedded Systems with FreeRTOS",
      reward_points: 25,
    },
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    actor: {
      full_name: "Aarav Sharma",
      role: "captain",
      email: "aarav@apexteam.edu",
    },
    target_profile: null,
  },
  {
    id: "log-4",
    performed_by: "manager-1",
    affected_user_id: null,
    action: "goal_created",
    metadata: {
      title: "Complete 15 Certifications Q3",
      target_value: 15,
      scope: "team",
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    actor: {
      full_name: "Rohan Nair",
      role: "manager",
      email: "rohan@apexteam.edu",
    },
    target_profile: null,
  },
  {
    id: "log-5",
    performed_by: "captain-1",
    affected_user_id: "member-3",
    action: "role_changed",
    metadata: {
      previous_role: "member",
      new_role: "strategist",
      target_email: "vikram@apexteam.edu",
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    actor: {
      full_name: "Aarav Sharma",
      role: "captain",
      email: "aarav@apexteam.edu",
    },
    target_profile: {
      full_name: "Vikram Malhotra",
      role: "strategist",
      email: "vikram@apexteam.edu",
    },
  },
  {
    id: "log-6",
    performed_by: "captain-1",
    affected_user_id: null,
    action: "settings_updated",
    metadata: {
      updated_fields: ["saturday_reminders_enabled", "timezone"],
      changes: {
        saturday_reminders_enabled: true,
        timezone: "Asia/Kolkata",
      },
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    actor: {
      full_name: "Aarav Sharma",
      role: "captain",
      email: "aarav@apexteam.edu",
    },
    target_profile: null,
  },
  {
    id: "log-7",
    performed_by: "system",
    affected_user_id: null,
    action: "weekly_report_generated",
    metadata: {
      report_title: "Week 36 Performance Summary",
      total_active_members: 14,
      total_activity_points: 1280,
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    actor: {
      full_name: "Automated System",
      role: "captain",
      email: "system@apexteam.edu",
    },
    target_profile: null,
  },
];

/**
 * Retrieves the organization's audit / activity timeline.
 * Restricted to leadership (Captain, Vice Captain, Manager, Strategist).
 * Regular members are denied access.
 */
export async function getActivityTimelineAction(options: {
  category?: TimelineFilterCategory;
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{
  success: boolean;
  activities: AuditLogWithActor[];
  totalCount: number;
  error?: string;
}> {
  const currentUser = await getCurrentUser();

  if (!currentUser.user) {
    return {
      success: false,
      activities: [],
      totalCount: 0,
      error: "Not authenticated.",
    };
  }

  if (!canViewActivityTimeline(currentUser.role)) {
    return {
      success: false,
      activities: [],
      totalCount: 0,
      error: "Unauthorized: Team activity timeline is restricted to leadership.",
    };
  }

  const category = options.category || "all";
  const search = options.search ? options.search.trim().toLowerCase() : "";
  const limit = options.limit || 50;
  const offset = options.offset || 0;

  if (!currentUser.isConfigured) {
    let filtered = [...MOCK_ACTIVITY_LOGS];

    // Category filter
    if (category !== "all") {
      const allowedActions = CATEGORY_ACTION_MAP[category] || [];
      filtered = filtered.filter((log) => allowedActions.includes(log.action));
    }

    // Search filter
    if (search) {
      filtered = filtered.filter((log) => {
        const actorMatch =
          log.actor?.full_name.toLowerCase().includes(search) ||
          log.actor?.email.toLowerCase().includes(search);
        const targetMatch =
          log.target_profile?.full_name.toLowerCase().includes(search) ||
          log.target_profile?.email.toLowerCase().includes(search);
        const actionMatch = log.action.toLowerCase().includes(search);
        const meta = (log.metadata || {}) as Record<string, any>;
        const reasonMatch =
          typeof meta.reason === "string" &&
          meta.reason.toLowerCase().includes(search);
        const titleMatch =
          typeof meta.course_title === "string" &&
          meta.course_title.toLowerCase().includes(search);

        return actorMatch || targetMatch || actionMatch || reasonMatch || titleMatch;
      });
    }

    const paginated = filtered.slice(offset, offset + limit);
    return {
      success: true,
      activities: paginated,
      totalCount: filtered.length,
    };
  }

  const supabase = await createClient();

  // Build query
  let query = (supabase.from("audit_logs") as any)
    .select(
      `
      *,
      actor:profiles!performed_by(full_name, role, email),
      target_profile:profiles!affected_user_id(full_name, role, email)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (category !== "all") {
    const allowedActions = CATEGORY_ACTION_MAP[category] || [];
    query = query.in("action", allowedActions);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return {
      success: false,
      activities: [],
      totalCount: 0,
      error: error.message,
    };
  }

  let activities = (data || []) as AuditLogWithActor[];

  // In-memory search filter for metadata / joined fields if provided
  if (search) {
    activities = activities.filter((log) => {
      const actorMatch =
        log.actor?.full_name?.toLowerCase().includes(search) ||
        log.actor?.email?.toLowerCase().includes(search);
      const targetMatch =
        log.target_profile?.full_name?.toLowerCase().includes(search) ||
        log.target_profile?.email?.toLowerCase().includes(search);
      const actionMatch = log.action.toLowerCase().includes(search);
      const metadataStr = JSON.stringify(log.metadata || {}).toLowerCase();
      const metaMatch = metadataStr.includes(search);

      return actorMatch || targetMatch || actionMatch || metaMatch;
    });
  }

  return {
    success: true,
    activities,
    totalCount: count || activities.length,
  };
}
