import { PageHeader } from "@/components/layout/page-header";
import { getCurrentUser } from "@/lib/supabase/server";
import { getLeaderboardAction, getPersonalRankAction } from "@/actions/leaderboard";
import { getAchievementsCatalogAction } from "@/actions/achievements";
import { LeaderboardPortal } from "@/components/leaderboard/leaderboard-portal";

export const metadata = {
  title: "Leaderboard & Milestones | Team Portal",
  description: "Official team performance rankings and milestone achievement tracking.",
};

export default async function LeaderboardPage() {
  const currentUser = await getCurrentUser();

  const [leaderboardRes, rankRes, catalogRes] = await Promise.all([
    getLeaderboardAction({ category: "overall", period: "all_time" }),
    getPersonalRankAction(),
    getAchievementsCatalogAction(currentUser.user?.id),
  ]);

  const initialEntries = leaderboardRes.entries || [];
  const personalRank = rankRes.personalRank || null;
  const achievementsCatalog = catalogRes.catalog || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leaderboard & Milestones"
        description="Transparent team performance rankings and verified milestone achievements."
      />

      <LeaderboardPortal
        initialEntries={initialEntries}
        initialCategory="overall"
        initialPeriod="all_time"
        personalRank={personalRank}
        achievementsCatalog={achievementsCatalog}
        currentUserId={currentUser.user?.id || ""}
        userRole={currentUser.role}
        userName={currentUser.profile?.full_name || "Team Member"}
      />
    </div>
  );
}
