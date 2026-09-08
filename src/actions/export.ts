"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { TeamExportRecord } from "@/types/domain";
import { canExportTeamData } from "@/lib/auth/permissions";

/**
 * Exports all active team members' performance metrics as a CSV string.
 * Strictly restricted to leadership (Captain / Vice Captain).
 */
export async function exportTeamPerformanceCSVAction(): Promise<{
  success: boolean;
  csvContent?: string;
  filename?: string;
  records?: TeamExportRecord[];
  error?: string;
}> {
  const currentUser = await getCurrentUser();

  if (!currentUser.user) {
    return { success: false, error: "Not authenticated." };
  }

  if (!canExportTeamData(currentUser.role)) {
    return {
      success: false,
      error: "Unauthorized: Only Captain and Vice Captain can export team performance data.",
    };
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const filename = `team-performance-${todayStr}.csv`;

  if (!currentUser.isConfigured) {
    const mockRecords: TeamExportRecord[] = [
      {
        member_id: "preview-1",
        full_name: "Aarav Sharma",
        email: "aarav@apexteam.edu",
        role: "captain",
        status: "active",
        activity_points: 340,
        reward_points: 120,
        completed_courses_count: 5,
        completed_goals_count: 4,
        overall_score: 460,
        created_at: "2026-08-01T00:00:00Z",
      },
      {
        member_id: "preview-2",
        full_name: "Diya Patel",
        email: "diya@apexteam.edu",
        role: "vice_captain",
        status: "active",
        activity_points: 290,
        reward_points: 95,
        completed_courses_count: 4,
        completed_goals_count: 3,
        overall_score: 385,
        created_at: "2026-08-03T00:00:00Z",
      },
      {
        member_id: "preview-3",
        full_name: "Rahul Verma",
        email: "rahul@apexteam.edu",
        role: "member",
        status: "active",
        activity_points: 215,
        reward_points: 60,
        completed_courses_count: 3,
        completed_goals_count: 2,
        overall_score: 275,
        created_at: "2026-08-10T00:00:00Z",
      },
    ];

    const csvContent = formatCSV(mockRecords);
    return {
      success: true,
      csvContent,
      filename,
      records: mockRecords,
    };
  }

  const supabase = await createClient();

  // Fetch all profiles
  const { data: profiles, error: profileError } = await (supabase.from("profiles") as any)
    .select("id, full_name, email, role, status, activity_points, reward_points, created_at")
    .order("activity_points", { ascending: false });

  if (profileError || !profiles) {
    return {
      success: false,
      error: profileError?.message || "Failed to query member records.",
    };
  }

  // Fetch completed courses per member
  const { data: coursesData } = await (supabase.from("member_courses") as any)
    .select("member_id");

  const courseCounts: Record<string, number> = {};
  (coursesData || []).forEach((c: { member_id: string }) => {
    courseCounts[c.member_id] = (courseCounts[c.member_id] || 0) + 1;
  });

  // Fetch completed goals per member
  const { data: goalsData } = await (supabase.from("goals") as any)
    .select("scope, target_member_id")
    .eq("status", "completed");

  const goalCounts: Record<string, number> = {};
  (goalsData || []).forEach((g: { scope: string; target_member_id?: string }) => {
    if (g.target_member_id) {
      goalCounts[g.target_member_id] = (goalCounts[g.target_member_id] || 0) + 1;
    }
  });

  const records: TeamExportRecord[] = profiles.map((p: any) => {
    const actPts = p.activity_points || 0;
    const rewPts = p.reward_points || 0;
    return {
      member_id: p.id,
      full_name: p.full_name,
      email: p.email,
      role: p.role,
      status: p.status,
      activity_points: actPts,
      reward_points: rewPts,
      completed_courses_count: courseCounts[p.id] || 0,
      completed_goals_count: goalCounts[p.id] || 0,
      overall_score: actPts + rewPts,
      created_at: p.created_at,
    };
  });

  const csvContent = formatCSV(records);

  // Log export in audit trail
  await (supabase.from("audit_logs") as any).insert({
    performed_by: currentUser.user.id,
    action: "member_exported",
    metadata: {
      exported_count: records.length,
      filename,
      exported_at: new Date().toISOString(),
    },
  });

  return {
    success: true,
    csvContent,
    filename,
    records,
  };
}

function formatCSV(records: TeamExportRecord[]): string {
  const headers = [
    "Member ID",
    "Full Name",
    "Email",
    "Role",
    "Status",
    "Activity Points",
    "Reward Points",
    "Courses Completed",
    "Goals Completed",
    "Overall Score",
    "Joined Date",
  ];

  const rows = records.map((r) => [
    escapeCSV(r.member_id),
    escapeCSV(r.full_name),
    escapeCSV(r.email),
    escapeCSV(r.role),
    escapeCSV(r.status),
    r.activity_points,
    r.reward_points,
    r.completed_courses_count,
    r.completed_goals_count,
    r.overall_score,
    escapeCSV(r.created_at.split("T")[0]),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
}

function escapeCSV(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}
