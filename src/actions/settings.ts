"use server";

import { revalidatePath } from "next/cache";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { TeamSettings } from "@/types/domain";
import { canManageTeamSettings } from "@/lib/auth/permissions";
import { updateMemberInfoAction } from "./members";

const DEFAULT_SETTINGS: TeamSettings = {
  id: "00000000-0000-0000-0000-000000000001",
  team_name: "Apex Engineering Team",
  team_description: "College technical team focused on high-performance development, engineering challenges, and continuous improvement.",
  timezone: "Asia/Kolkata",
  saturday_reminders_enabled: true,
  auto_reports_enabled: true,
  reporting_schedule: {
    week_start: "Sunday",
    week_end: "Saturday",
    reminder_times: ["11:00", "16:00", "18:00"],
    report_time: "20:00",
  },
  updated_by: null,
  updated_at: new Date().toISOString(),
};

/**
 * Retrieves the organization's team settings.
 */
export async function getTeamSettingsAction(): Promise<{
  success: boolean;
  settings: TeamSettings;
  error?: string;
}> {
  const currentUser = await getCurrentUser();

  if (!currentUser.user) {
    return {
      success: false,
      settings: DEFAULT_SETTINGS,
      error: "Not authenticated.",
    };
  }

  if (!currentUser.isConfigured) {
    return {
      success: true,
      settings: DEFAULT_SETTINGS,
    };
  }

  const supabase = await createClient();

  const { data, error } = await (supabase.from("team_settings") as any)
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return {
      success: true,
      settings: DEFAULT_SETTINGS,
    };
  }

  return {
    success: true,
    settings: data as TeamSettings,
  };
}

/**
 * Updates team workspace settings.
 * Strictly restricted to leadership (Captain / Vice Captain).
 */
export async function updateTeamSettingsAction(input: {
  team_name?: string;
  team_description?: string;
  timezone?: string;
  saturday_reminders_enabled?: boolean;
  auto_reports_enabled?: boolean;
}): Promise<{
  success: boolean;
  error?: string;
  settings?: TeamSettings;
}> {
  const currentUser = await getCurrentUser();

  if (!currentUser.user || !canManageTeamSettings(currentUser.role)) {
    return {
      success: false,
      error: "Unauthorized: Only Captain and Vice Captain can update team settings.",
    };
  }

  const updates: Partial<TeamSettings> = {
    updated_at: new Date().toISOString(),
    updated_by: currentUser.user.id,
  };

  if (input.team_name !== undefined) {
    const cleanedName = input.team_name.trim();
    if (cleanedName.length < 2 || cleanedName.length > 100) {
      return {
        success: false,
        error: "Team name must be between 2 and 100 characters.",
      };
    }
    updates.team_name = cleanedName;
  }

  if (input.team_description !== undefined) {
    const cleanedDesc = input.team_description.trim();
    if (cleanedDesc.length > 500) {
      return {
        success: false,
        error: "Team description must be 500 characters or less.",
      };
    }
    updates.team_description = cleanedDesc;
  }

  if (input.timezone !== undefined) {
    const tz = input.timezone.trim();
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      updates.timezone = tz;
    } catch {
      return {
        success: false,
        error: `Invalid IANA timezone identifier: "${tz}".`,
      };
    }
  }

  if (input.saturday_reminders_enabled !== undefined) {
    updates.saturday_reminders_enabled = Boolean(input.saturday_reminders_enabled);
  }

  if (input.auto_reports_enabled !== undefined) {
    updates.auto_reports_enabled = Boolean(input.auto_reports_enabled);
  }

  if (!currentUser.isConfigured) {
    return {
      success: true,
      settings: { ...DEFAULT_SETTINGS, ...updates },
    };
  }

  const supabase = await createClient();

  // First find existing row
  const { data: existing } = await (supabase.from("team_settings") as any)
    .select("id")
    .limit(1)
    .maybeSingle();

  let data: any;
  let error: any;

  if (existing?.id) {
    const res = await (supabase.from("team_settings") as any)
      .update(updates)
      .eq("id", existing.id)
      .select()
      .single();
    data = res.data;
    error = res.error;
  } else {
    const res = await (supabase.from("team_settings") as any)
      .insert({ ...DEFAULT_SETTINGS, ...updates })
      .select()
      .single();
    data = res.data;
    error = res.error;
  }

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  // Audit log for settings update
  await (supabase.from("audit_logs") as any).insert({
    performed_by: currentUser.user.id,
    action: "settings_updated",
    metadata: {
      updated_fields: Object.keys(updates).filter((k) => k !== "updated_at"),
      changes: updates,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/reports");

  return {
    success: true,
    settings: data as TeamSettings,
  };
}

/**
 * Updates current authenticated member's personal account settings.
 * Does NOT permit changing role, status, or points (strict separation).
 */
export async function updatePersonalAccountAction(input: {
  fullName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  githubUsername?: string | null;
  linkedinUrl?: string | null;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser.user) {
    return {
      success: false,
      error: "Not authenticated.",
    };
  }

  return updateMemberInfoAction({
    targetUserId: currentUser.user.id,
    ...input,
  });
}
