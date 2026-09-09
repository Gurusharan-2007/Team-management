import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, createClient } from "@/lib/supabase/server";
import { canViewMemberProfile, canManageMembers, isLeadership } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleBadge } from "@/components/ui/role-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AccessDenied } from "@/components/ui/access-denied";
import { Button } from "@/components/ui/button";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";
import { MemberCoursesSection } from "@/components/courses/member-courses-section";
import { ManagePointsDialog } from "@/components/points/manage-points-dialog";
import { PointHistorySection } from "@/components/points/point-history-section";
import {
  Zap,
  Award,
  Calendar,
  Mail,
  Shield,
  ArrowLeft,
  TrendingUp,
  Activity,
  BookOpen,
} from "lucide-react";
import { getInitials, formatPoints, formatDate } from "@/lib/utils";
import { MemberListItem, UserRole, Profile, Course, PointHistoryItemWithActor } from "@/types/domain";
import { getAchievementsCatalogAction } from "@/actions/achievements";
import { AchievementsGrid } from "@/components/achievements/achievements-grid";

interface ProfilePageProps {
  params: {
    id: string;
  };
}

export default async function MemberDetailPage({ params }: ProfilePageProps) {
  const currentUser = await getCurrentUser();
  const callerId = currentUser.user?.id || "";
  const callerRole = currentUser.role;

  // SERVER-SIDE PERMISSION ENFORCEMENT:
  // Members cannot view another member's profile by changing the URL ID.
  const isAuthorized = canViewMemberProfile(callerRole, callerId, params.id);

  if (!isAuthorized) {
    return (
      <AccessDenied
        title="Private Member Profile"
        message="Members may only view their own detailed profile and reports. You do not have permission to inspect another member's individual data."
        requiredRole="Captain, Vice Captain, Manager, or Strategist"
      />
    );
  }

  let member: MemberListItem | null = null;
  let allCourses: Course[] = [];
  let completedCourses: Course[] = [];
  let pointHistory: PointHistoryItemWithActor[] = [];

  if (currentUser.isConfigured) {
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", params.id)
        .single();

      if (profile) {
        // Fetch completed courses
        const { data: mc } = await supabase
          .from("member_courses")
          .select("course:courses(*)")
          .eq("member_id", params.id);

        completedCourses = (mc || [])
          .map((item: any) => item.course)
          .filter(Boolean);

        member = {
          ...(profile as Profile),
          completed_courses_count: completedCourses.length,
        };

        // Fetch point history
        const { data: phData } = await supabase
          .from("point_history")
          .select("*, actor:profiles!changed_by(full_name, role, email)")
          .eq("member_id", params.id)
          .order("created_at", { ascending: false });

        if (phData) {
          pointHistory = phData as PointHistoryItemWithActor[];
        }
      }
    } catch {
      // Fallback
    }
  }

  const catalogRes = await getAchievementsCatalogAction(params.id);
  const achievementsCatalog = catalogRes.catalog || [];

  // Fallback courses if empty
  if (allCourses.length === 0) {
    allCourses = [
      { id: "c-1", name: "Python Fundamentals", description: "Core data structures, OOP, file handling, and algorithmic programming.", status: "active", created_at: new Date().toISOString() },
      { id: "c-2", name: "React & Next.js Development", description: "Component patterns, App Router, Server Components, and state management.", status: "active", created_at: new Date().toISOString() },
      { id: "c-3", name: "Git & Team Collaboration", description: "Branching strategies, pull request reviews, merge conflict resolution, and CI/CD basics.", status: "active", created_at: new Date().toISOString() },
      { id: "c-4", name: "PostgreSQL & Database Design", description: "Schema modeling, indexes, foreign keys, row-level security, and query optimization.", status: "active", created_at: new Date().toISOString() },
      { id: "c-5", name: "Cloud Infrastructure & Docker", description: "Containerization, environment configuration, cloud deployment, and monitoring.", status: "active", created_at: new Date().toISOString() },
      { id: "c-6", name: "TypeScript & Design Patterns", description: "Strict typing, generics, utility types, and clean software architecture.", status: "active", created_at: new Date().toISOString() },
      { id: "c-7", name: "REST & API Architecture", description: "RESTful principles, HTTP methods, JSON payloads, error handling, and authentication.", status: "active", created_at: new Date().toISOString() },
    ];
  }

  // Fallback demo mock if target is local or not in db
  if (!member) {
    if (params.id.startsWith("mem-") || params.id === callerId) {
      member = {
        id: params.id,
        full_name: params.id === callerId ? currentUser.profile?.full_name || "Alex Rivera" : "Jordan Lee",
        email: params.id === callerId ? currentUser.user?.email || "alex@college.edu" : "jordan@college.edu",
        role: (params.id === callerId ? currentUser.role : "member") as UserRole,
        status: "active",
        activity_points: 75,
        reward_points: 25,
        avatar_url: null,
        completed_courses_count: 2,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (completedCourses.length === 0) {
        completedCourses = [allCourses[0], allCourses[1]];
      }
    } else {
      notFound();
    }
  }

  if (!member) {
    notFound();
  }



  const isSelf = callerId === member.id;
  const canAdmin = canManageMembers(callerRole);
  const canEditCourses = isSelf || canAdmin;
  const canManageCatalog = isLeadership(callerRole);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-muted-foreground">
          <Link href="/team">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to Team Directory
          </Link>
        </Button>
      </div>

      <PageHeader
        title={isSelf ? "My Profile" : `${member.full_name}'s Profile`}
        description={
          isSelf
            ? "Your identity, course certifications, and individual performance overview."
            : `Individual performance overview and team standing for ${member.full_name}.`
        }
      >
        <div className="flex items-center gap-2">
          {canAdmin && !isSelf && (
            <ManagePointsDialog
              targetMemberId={member.id}
              targetMemberName={member.full_name}
              currentActivityPoints={member.activity_points || 0}
              currentRewardPoints={member.reward_points || 0}
              isSelfUpdate={false}
            />
          )}

          {isSelf && (
            <ManagePointsDialog
              targetMemberId={member.id}
              targetMemberName={member.full_name}
              currentActivityPoints={member.activity_points || 0}
              currentRewardPoints={member.reward_points || 0}
              isSelfUpdate={true}
            />
          )}
        </div>
      </PageHeader>

      {/* Member Overview Card */}
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-border shrink-0">
                {member.avatar_url && (
                  <AvatarImage src={member.avatar_url} alt={member.full_name} />
                )}
                <AvatarFallback className="text-lg font-bold">
                  {getInitials(member.full_name)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    {member.full_name}
                  </h2>
                  <RoleBadge role={member.role} />
                  {member.status === "active" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                      Inactive
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Mail className="h-3.5 w-3.5" />
                    {member.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {formatDate(member.created_at)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    {isSelf ? "Self profile" : "Protected by RLS"}
                  </span>
                </div>
              </div>
            </div>

            {(isSelf || canAdmin) && (
              <EditProfileDialog
                userId={member.id}
                initialName={member.full_name}
                initialAvatarUrl={member.avatar_url}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visually Distinct 3-Column Statistics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Activity Points Card */}
        <Card className="border-border/90 bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-semibold">Activity Points</CardTitle>
              <CardDescription className="text-xs">Weekly milestones &amp; tasks</CardDescription>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Zap className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {formatPoints(member.activity_points || 0)}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Current balance (non-negative verified balance)
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
              {formatPoints(member.reward_points || 0)}
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
              {member.completed_courses_count || 0}
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
        memberId={member.id}
        memberName={member.full_name}
      />

      {/* Completed Technical Courses */}
      <MemberCoursesSection
        targetMemberId={member.id}
        targetMemberName={member.full_name}
        completedCourses={completedCourses}
        allCourses={allCourses}
        canEditCourses={canEditCourses}
        canManageCatalog={canManageCatalog}
      />

      {/* Earned Milestones & Achievements Section */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-semibold">Earned Milestones &amp; Badges</CardTitle>
            <CardDescription>
              Recognitions earned through points, courses, and weekly contributions
            </CardDescription>
          </div>
          <Award className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <AchievementsGrid
            achievements={achievementsCatalog}
            emptyMessage="No milestone achievements recorded for this member yet."
          />
        </CardContent>
      </Card>

      {/* Weekly Performance Trend Layout (Prepared container, NO fake data) */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-semibold">Weekly Performance Snapshots</CardTitle>
            <CardDescription>
              Trend chart container for weekly report snapshot data
            </CardDescription>
          </div>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={TrendingUp}
            badgeText="Performance Analytics"
            title="Weekly Trend Charts"
            description="Individual weekly performance snapshots from the Saturday reporting cycle will display here once snapshot cycles commence."
            className="py-10 border-dashed"
          />
        </CardContent>
      </Card>
    </div>
  );
}
