import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { isLeadership } from "@/lib/auth/permissions";
import { getTeamSettingsAction } from "@/actions/settings";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsPortal } from "@/components/settings/settings-portal";
import { Profile } from "@/types/domain";

export const metadata: Metadata = {
  title: "Settings | Apex Team Management",
  description: "Personal and administrative workspace settings",
};

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser.user) {
    redirect("/login");
  }

  const { settings } = await getTeamSettingsAction();
  const hasLeadership = isLeadership(currentUser.role);

  const fallbackProfile: Profile = {
    id: currentUser.user.id,
    full_name: currentUser.profile?.full_name || "Team Member",
    email: currentUser.user.email || "member@apexteam.edu",
    role: currentUser.role || "member",
    status: currentUser.profile?.status || "active",
    activity_points: currentUser.profile?.activity_points || 0,
    reward_points: currentUser.profile?.reward_points || 0,
    avatar_url: currentUser.profile?.avatar_url || null,
    bio: currentUser.profile?.bio || null,
    github_username: currentUser.profile?.github_username || null,
    linkedin_url: currentUser.profile?.linkedin_url || null,
    created_at: currentUser.profile?.created_at || new Date().toISOString(),
    updated_at: currentUser.profile?.updated_at || new Date().toISOString(),
  };

  const profile = currentUser.profile || fallbackProfile;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Workspace Preferences"
        description="Manage personal credentials, team configuration, weekly report automation schedules, and data compliance."
      />
      <SettingsPortal
        profile={profile}
        settings={settings}
        hasLeadership={hasLeadership}
      />
    </div>
  );
}
