import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { canViewActivityTimeline } from "@/lib/auth/permissions";
import { getActivityTimelineAction } from "@/actions/activity";
import { PageHeader } from "@/components/layout/page-header";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { AccessDenied } from "@/components/ui/access-denied";

export const metadata: Metadata = {
  title: "Team Activity | Team Portal",
  description: "Organizational audit trail and activity log",
};

export default async function ActivityPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser.user) {
    redirect("/login");
  }

  // Security gate: Leadership only
  if (!canViewActivityTimeline(currentUser.role)) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Team Activity & Audit Trail"
          description="Organizational event log and audit history"
        />
        <AccessDenied
          title="Leadership Access Required"
          message="The organization activity timeline is restricted to team leadership (Captain, Vice Captain, Manager, and Strategist). Regular members cannot inspect administrative event logs."
          requiredRole="Leadership"
        />
      </div>
    );
  }

  const { activities, totalCount } = await getActivityTimelineAction({ limit: 100 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Activity & Audit Trail"
        description="Immutable chronological log of points awards, course completions, goals, role updates, and system events."
      />
      <ActivityTimeline
        initialActivities={activities}
        totalCount={totalCount}
      />
    </div>
  );
}
