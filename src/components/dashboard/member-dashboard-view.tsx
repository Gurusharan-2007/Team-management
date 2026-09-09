import * as React from "react";
import Link from "next/link";
import {
  Zap,
  Award,
  BookOpen,
  Users,
  Target,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/role-badge";
import { GoalsSection } from "@/components/goals/goals-section";
import { TopPerformersCard, PerformerMember } from "./top-performers-card";
import { GoalWithProgress, UserRole } from "@/types/domain";
import { formatPoints } from "@/lib/utils";

interface MemberDashboardViewProps {
  member: {
    id: string;
    full_name: string;
    role: UserRole;
    activity_points: number;
    reward_points: number;
    email?: string;
  };
  completedCoursesCount: number;
  goals: GoalWithProgress[];
  activeMemberCount: number;
  teamTotalActivityPoints: number;
  teamTotalRewardPoints: number;
  topPerformers: PerformerMember[];
}

export function MemberDashboardView({
  member,
  completedCoursesCount,
  goals,
  activeMemberCount,
  teamTotalActivityPoints,
  teamTotalRewardPoints,
  topPerformers,
}: MemberDashboardViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-5 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Member Dashboard
            </h1>
            <RoleBadge role={member.role} />
          </div>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Welcome back, <span className="font-medium text-foreground">{member.full_name}</span>. Track your verified contributions, team milestones, and skill achievements.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 sm:pt-0 shrink-0">
          <Button variant="outline" size="sm" asChild className="text-xs shadow-xs">
            <Link href="/leaderboard">
              <Trophy className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
              Leaderboard
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="text-xs shadow-xs">
            <Link href="/team">
              <Users className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              Team Directory
            </Link>
          </Button>
          <Button size="sm" asChild className="text-xs shadow-xs">
            <Link href="/profile">
              <Zap className="mr-1.5 h-3.5 w-3.5" />
              My Points Ledger
            </Link>
          </Button>
        </div>
      </div>

      {/* Section 1: My Performance */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            My Performance &amp; Activity
          </h2>
          <span className="text-xs text-muted-foreground">Real-time sync</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* My Activity Points */}
          <Card className="glass-card hover:border-amber-500/40 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                My Activity Points
              </CardTitle>
              <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 border border-amber-500/20">
                <Zap className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight font-mono text-foreground">
                {formatPoints(member.activity_points || 0)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Verified task &amp; contribution points
              </p>
              <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Ledger balance</span>
                <Link
                  href="/profile"
                  className="font-medium text-primary hover:underline flex items-center gap-1"
                >
                  View Details
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* My Reward Points */}
          <Card className="glass-card hover:border-purple-500/40 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                My Reward Points
              </CardTitle>
              <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-500 dark:bg-purple-500/20 border border-purple-500/20">
                <Award className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight font-mono text-foreground">
                {formatPoints(member.reward_points || 0)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Leadership honors &amp; recognitions
              </p>
              <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Earned awards</span>
                <Link
                  href="/profile"
                  className="font-medium text-primary hover:underline flex items-center gap-1"
                >
                  Honors Ledger
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* My Completed Courses */}
          <Card className="glass-card hover:border-blue-500/40 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Completed Courses
              </CardTitle>
              <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 border border-blue-500/20">
                <BookOpen className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight font-mono text-foreground">
                {completedCoursesCount}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Verified skill credentials
              </p>
              <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Course catalog</span>
                <Link
                  href="/profile"
                  className="font-medium text-primary hover:underline flex items-center gap-1"
                >
                  My Courses
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Section 2: My Goals & Targets */}
      <GoalsSection
        goals={goals}
        canManageGoals={false}
        title="My Goals &amp; Milestones"
        description="Active team goals and personal targets assigned to your profile"
      />

      {/* Section 3: Team Summary & Top Performers */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Team Summary Card */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
              Team Overview
            </CardTitle>
            <CardDescription className="text-xs">
              Summary of overall team capacity and aggregate points momentum
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-muted/30 rounded-xl border border-border/60 text-center">
              <div>
                <div className="text-lg font-bold font-mono text-foreground">
                  {activeMemberCount}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Active Members</div>
              </div>
              <div>
                <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                  {formatPoints(teamTotalActivityPoints)}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Team Act Pts</div>
              </div>
              <div>
                <div className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">
                  {formatPoints(teamTotalRewardPoints)}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Team Rew Pts</div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Every verified task, pull request, technical course, and milestone you complete contributes directly to the team&apos;s overall standing and quarterly benchmarks.
            </p>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Collaborate with colleagues</span>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs font-medium text-primary hover:text-primary hover:bg-primary/5">
                <Link href="/team" className="flex items-center gap-1">
                  Team Directory
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers Preview */}
        <TopPerformersCard
          members={topPerformers}
          title="Team Benchmarks"
          description="High achievers driving team progress this cycle"
          compact={true}
          limit={4}
        />
      </div>
    </div>
  );
}
