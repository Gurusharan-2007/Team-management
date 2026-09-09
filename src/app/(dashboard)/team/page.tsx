import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { TeamDirectory } from "@/components/team/team-directory";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";
import { MemberListItem, UserRole, Profile } from "@/types/domain";
import { canManageMembers } from "@/lib/auth/permissions";

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Directory"
        description="Team roster, role permissions, and active member technical profiles."
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
