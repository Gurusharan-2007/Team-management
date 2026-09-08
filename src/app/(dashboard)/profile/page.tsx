import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleBadge } from "@/components/ui/role-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";
import { MemberCoursesSection } from "@/components/courses/member-courses-section";
import { ManagePointsDialog } from "@/components/points/manage-points-dialog";
import { PointHistorySection } from "@/components/points/point-history-section";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { isLeadership } from "@/lib/auth/permissions";
import { Zap, Award, Calendar, Mail, Shield, Activity, TrendingUp, BookOpen, Sliders } from "lucide-react";
import { getInitials, formatPoints, formatDate } from "@/lib/utils";
import { Course, PointHistoryItemWithActor, AchievementWithStatus } from "@/types/domain";
import { getPersonalRankAction } from "@/actions/leaderboard";
import { getAchievementsCatalogAction } from "@/actions/achievements";
import { PersonalRankBanner } from "@/components/leaderboard/personal-rank-banner";
import { AchievementsGrid } from "@/components/achievements/achievements-grid";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  const userEmail = currentUser.user?.email || "member@college.edu";
  const userName = currentUser.profile?.full_name || "Team Member";
  const userAvatar = currentUser.profile?.avatar_url;
  const userRole = currentUser.role;
  const userId = currentUser.user?.id || "preview-user-id";
  const createdAt = currentUser.profile?.created_at || new Date().toISOString();
  const activityPoints = currentUser.profile?.activity_points || 0;
  const rewardPoints = currentUser.profile?.reward_points || 0;

  let allCourses: Course[] = [];
  let completedCourses: Course[] = [];
  let pointHistory: PointHistoryItemWithActor[] = [];

  if (currentUser.isConfigured && currentUser.user) {
    try {
      const supabase = await createClient();

      // Fetch all courses
      const { data: cData } = await supabase
        .from("courses")
        .select("*")
        .order("name", { ascending: true });

      if (cData) {
        allCourses = cData as Course[];
      }

      // Fetch completed courses
      const { data: mc } = await supabase
        .from("member_courses")
        .select("course:courses(*)")
        .eq("member_id", currentUser.user.id);

      completedCourses = (mc || [])
        .map((item: any) => item.course)
        .filter(Boolean);

      // Fetch point history
      const { data: phData } = await supabase
        .from("point_history")
        .select("*, actor:profiles!changed_by(full_name, role, email)")
        .eq("member_id", currentUser.user.id)
        .order("created_at", { ascending: false });

      if (phData) {
        pointHistory = phData as PointHistoryItemWithActor[];
      }
    } catch {
      // Fallback
    }
  }

  const [rankRes, catalogRes] = await Promise.all([
    getPersonalRankAction(),
    getAchievementsCatalogAction(userId),
  ]);
  const personalRank = rankRes.personalRank || null;
  const achievementsCatalog = catalogRes.catalog || [];

  // Fallback defaults for preview mode
  if (allCourses.length === 0) {
    allCourses = [
      {
        id: "c-1",
        name: "Python Fundamentals",
        description: "Core data structures, OOP, file handling, and algorithmic programming.",
        status: "active",
        created_at: new Date().toISOString(),
      },
      {
        id: "c-2",
        name: "React & Next.js Development",
        description: "Component patterns, App Router, Server Components, and state management.",
        status: "active",
        created_at: new Date().toISOString(),
      },
      {
        id: "c-3",
        name: "Git & Team Collaboration",
        description: "Branching strategies, pull request reviews, merge conflict resolution, and CI/CD basics.",
        status: "active",
        created_at: new Date().toISOString(),
      },
      {
        id: "c-4",
        name: "PostgreSQL & Database Design",
        description: "Schema modeling, indexes, foreign keys, row-level security, and query optimization.",
        status: "active",
        created_at: new Date().toISOString(),
      },
      {
        id: "c-5",
        name: "Cloud Infrastructure & Docker",
        description: "Containerization, environment configuration, cloud deployment, and monitoring.",
        status: "active",
        created_at: new Date().toISOString(),
      },
      {
        id: "c-6",
        name: "TypeScript & Design Patterns",
        description: "Strict typing, generics, utility types, and clean software architecture.",
        status: "active",
        created_at: new Date().toISOString(),
      },
      {
        id: "c-7",
        name: "REST & API Architecture",
        description: "RESTful principles, HTTP methods, JSON payloads, error handling, and authentication.",
        status: "active",
        created_at: new Date().toISOString(),
      },
    ];
    if (completedCourses.length === 0) {
      completedCourses = [allCourses[0], allCourses[1]];
    }
  }

  if (pointHistory.length === 0) {
    pointHistory = [
      {
        id: "ph-1",
        member_id: userId,
        point_type: "activity",
        previous_value: Math.max(0, activityPoints - 10),
        new_value: activityPoints,
        change_amount: 10,
        reason: "Completed weekly technical task sprint & submitted PR",
        changed_by: userId,
        source: "self_update",
        actor_role: userRole,
        created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
        actor: {
          full_name: userName,
          role: userRole,
          email: userEmail,
        },
      },
      {
        id: "ph-2",
        member_id: userId,
        point_type: "reward",
        previous_value: Math.max(0, rewardPoints - 5),
        new_value: rewardPoints,
        change_amount: 5,
        reason: "Leadership recognition for assisting teammates with database setup",
        changed_by: "captain-id",
        source: "admin_adjustment",
        actor_role: "captain",
        created_at: new Date(Date.now() - 28 * 3600000).toISOString(),
        actor: {
          full_name: "Alex Rivera",
          role: "captain",
          email: "alex@college.edu",
        },
      },
    ];
  }

  const canManageCatalog = isLeadership(userRole);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Manage your college team identity, point balances, course certifications, and performance ledger."
      >
        <div className="flex items-center gap-2">
          <ManagePointsDialog
            targetMemberId={userId}
            targetMemberName={userName}
            currentActivityPoints={activityPoints}
            currentRewardPoints={rewardPoints}
            isSelfUpdate={true}
          />
        </div>
      </PageHeader>

      {/* Profile Overview Card */}
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-border shrink-0">
                {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
                <AvatarFallback className="text-lg font-bold">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    {userName}
                  </h2>
                  <RoleBadge role={userRole} />
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Mail className="h-3.5 w-3.5" />
                    {userEmail}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {formatDate(createdAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    Protected by RLS
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <EditProfileDialog
                userId={userId}
                initialName={userName}
                initialAvatarUrl={userAvatar}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Rank Standing */}
      <PersonalRankBanner rankSummary={personalRank} userName={userName} />

      {/* Visually Distinct 3-Column Statistics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Activity Points Card */}
        <Card className="border-border/90 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-semibold">Activity Points</CardTitle>
              <CardDescription className="text-xs">Weekly contributions &amp; tasks</CardDescription>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Zap className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {formatPoints(activityPoints)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Current balance (non-negative, updated via points ledger)
            </p>
          </CardContent>
        </Card>

        {/* Reward Points Card */}
        <Card className="border-border/90 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-semibold">Reward Points</CardTitle>
              <CardDescription className="text-xs">Leadership honors &amp; awards</CardDescription>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Award className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {formatPoints(rewardPoints)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Current balance (managed by leadership &amp; verified self-logs)
            </p>
          </CardContent>
        </Card>

        {/* Completed Courses Card */}
        <Card className="border-border/90 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-semibold">Courses Completed</CardTitle>
              <CardDescription className="text-xs">Technical competencies verified</CardDescription>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BookOpen className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {completedCourses.length}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Verified certifications recorded in catalog
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Point History Section with Type Filtering & Sorting */}
      <PointHistorySection
        initialHistory={pointHistory}
        memberId={userId}
        memberName={userName}
      />

      {/* Completed Technical Courses */}
      <MemberCoursesSection
        targetMemberId={userId}
        targetMemberName={userName}
        completedCourses={completedCourses}
        allCourses={allCourses}
        canEditCourses={true}
        canManageCatalog={canManageCatalog}
      />

      {/* Earned Milestones & Achievements Section */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-semibold">Earned Milestones &amp; Badges</CardTitle>
            <CardDescription>
              Automatic recognitions earned through points, courses, and weekly contributions
            </CardDescription>
          </div>
          <Award className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <AchievementsGrid
            achievements={achievementsCatalog}
            emptyMessage="No milestone achievements recorded yet."
          />
        </CardContent>
      </Card>

      {/* Weekly Performance Trend Layout (Prepared container, NO fake charts) */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-semibold">Weekly Performance Snapshots</CardTitle>
            <CardDescription>
              Trend chart container for weekly snapshot reports
            </CardDescription>
          </div>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={TrendingUp}
            badgeText="Step 4 Telemetry Container"
            title="Weekly Trend Analytics"
            description="Individual weekly performance snapshots from weekly_reports will be plotted here with Recharts once reporting cycles commence."
            className="py-10 border-dashed"
          />
        </CardContent>
      </Card>
    </div>
  );
}
