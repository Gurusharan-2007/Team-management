import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { TeamDirectory } from "@/components/team/team-directory";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";
import { MemberListItem, UserRole, Profile } from "@/types/domain";
import { canManageMembers } from "@/lib/auth/permissions";

// Fallback seed for preview mode if database is completely empty
const DEFAULT_PREVIEW_MEMBERS: MemberListItem[] = [
  {
    id: "mem-1",
    full_name: "Alex Rivera",
    email: "alex.rivera@college.edu",
    role: "captain",
    status: "active",
    activity_points: 120,
    reward_points: 45,
    avatar_url: null,
    completed_courses_count: 4,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mem-2",
    full_name: "Samantha Chen",
    email: "sam.chen@college.edu",
    role: "vice_captain",
    status: "active",
    activity_points: 95,
    reward_points: 30,
    avatar_url: null,
    completed_courses_count: 3,
    created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mem-3",
    full_name: "Marcus Brody",
    email: "marcus.b@college.edu",
    role: "manager",
    status: "active",
    activity_points: 70,
    reward_points: 15,
    avatar_url: null,
    completed_courses_count: 2,
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mem-4",
    full_name: "Elena Rostova",
    email: "elena.r@college.edu",
    role: "strategist",
    status: "active",
    activity_points: 80,
    reward_points: 20,
    avatar_url: null,
    completed_courses_count: 3,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mem-5",
    full_name: "David Kim",
    email: "david.k@college.edu",
    role: "member",
    status: "active",
    activity_points: 50,
    reward_points: 10,
    avatar_url: null,
    completed_courses_count: 1,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mem-6",
    full_name: "Priya Patel",
    email: "priya.p@college.edu",
    role: "member",
    status: "active",
    activity_points: 40,
    reward_points: 5,
    avatar_url: null,
    completed_courses_count: 1,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default async function TeamPage() {
  const currentUser = await getCurrentUser();
  const canManage = canManageMembers(currentUser.role);

  let members: MemberListItem[] = [];

  if (currentUser.isConfigured) {
    try {
      const supabase = await createClient();
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && profiles && profiles.length > 0) {
        // Fetch course counts
        const { data: memberCourses } = await (supabase.from("member_courses") as any)
          .select("member_id");

        const courseCountMap = new Map<string, number>();
        (memberCourses || []).forEach((mc: any) => {
          courseCountMap.set(
            mc.member_id,
            (courseCountMap.get(mc.member_id) || 0) + 1
          );
        });

        members = (profiles as Profile[]).map((p) => ({
          ...p,
          completed_courses_count: courseCountMap.get(p.id) || 0,
        }));
      }
    } catch {
      // Fallback
    }
  }

  // Fallback if empty
  if (members.length === 0) {
    members = DEFAULT_PREVIEW_MEMBERS;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Directory"
        description="College group directory, technical competencies, and role assignments."
      >
        <InviteMemberDialog canManage={canManage} />
      </PageHeader>

      <TeamDirectory
        initialMembers={members}
        currentUserRole={currentUser.role}
        currentUserId={currentUser.user?.id || ""}
      />
    </div>
  );
}
