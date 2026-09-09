"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Target,
  Users,
  User,
  Zap,
  Award,
  Calendar,
  CheckCircle2,
  Plus,
  Edit2,
  Archive,
  RotateCcw,
  Check,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { GoalWithProgress } from "@/types/domain";
import { formatPoints, formatDate } from "@/lib/utils";
import { GoalDialog } from "./goal-dialog";
import { toggleGoalStatusAction } from "@/actions/goals";

interface GoalsSectionProps {
  goals: GoalWithProgress[];
  canManageGoals: boolean;
  activeMembers?: { id: string; full_name: string; role: string }[];
  title?: string;
  description?: string;
  compact?: boolean;
}

export function GoalsSection({
  goals,
  canManageGoals,
  activeMembers = [],
  title = "Active Goals & Targets",
  description = "Progress tracking against team milestones and individual targets",
  compact = false,
}: GoalsSectionProps) {
  const router = useRouter();
  const [editingGoal, setEditingGoal] = React.useState<GoalWithProgress | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  async function handleToggleStatus(goalId: string, newStatus: "active" | "completed" | "archived") {
    setActionLoading(goalId);
    try {
      await toggleGoalStatusAction({ goalId, status: newStatus });
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {title}
          </h2>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>

        {canManageGoals && (
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="text-xs shrink-0 self-start sm:self-auto"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Goal / Target
          </Button>
        )}
      </div>

      {/* Goal Creation Dialog */}
      {canManageGoals && (
        <GoalDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          activeMembers={activeMembers}
        />
      )}

      {/* Goal Edit Dialog */}
      {canManageGoals && editingGoal && (
        <GoalDialog
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) setEditingGoal(null);
          }}
          goalToEdit={editingGoal}
          activeMembers={activeMembers}
        />
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          badgeText="Performance Targets"
          title="No Active Goals"
          description={
            canManageGoals
              ? "Set clear targets for the team or individual members to keep everyone aligned and motivated."
              : "No active targets have been assigned to your profile or the team yet."
          }
          action={
            canManageGoals ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="text-xs"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Create First Target
              </Button>
            ) : undefined
          }
          className="min-h-[220px]"
        />
      ) : (
        <div
          className={
            compact
              ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
              : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          }
        >
          {goals.map((goal) => {
            const isCompleted = goal.is_completed || goal.status === "completed";
            const isActivity = goal.point_type === "activity";
            const isLoading = actionLoading === goal.id;

            return (
              <Card
                key={goal.id}
                className={`transition-all duration-200 flex flex-col justify-between hover:border-border ${
                  isCompleted ? "border-emerald-500/30 bg-emerald-500/[0.02] shadow-xs" : "border-border/70"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Scope Badge */}
                      {goal.scope === "team" ? (
                        <Badge variant="subtle" className="text-[10px] gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                          <Users className="h-3 w-3" />
                          Team Target
                        </Badge>
                      ) : (
                        <Badge variant="subtle" className="text-[10px] gap-1 bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20">
                          <User className="h-3 w-3" />
                          {goal.target_member?.full_name || "Individual"}
                        </Badge>
                      )}

                      {/* Point Type Badge */}
                      <Badge
                        variant="subtle"
                        className={`text-[10px] gap-1 ${
                          isActivity
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        }`}
                      >
                        {isActivity ? (
                          <Zap className="h-3 w-3" />
                        ) : (
                          <Award className="h-3 w-3" />
                        )}
                        {isActivity ? "Activity Pts" : "Reward Pts"}
                      </Badge>
                    </div>

                    {/* Completion Badge */}
                    {isCompleted ? (
                      <Badge variant="success" className="text-[10px] gap-1 shrink-0">
                        <CheckCircle2 className="h-3 w-3" />
                        Target Reached
                      </Badge>
                    ) : (
                      <span className="text-xs font-mono font-semibold text-muted-foreground">
                        {goal.progress_percentage}%
                      </span>
                    )}
                  </div>

                  <CardTitle className="text-sm font-semibold mt-2 line-clamp-1">
                    {goal.title}
                  </CardTitle>
                  {goal.description && (
                    <CardDescription className="text-xs line-clamp-2 mt-0.5">
                      {goal.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <Progress
                      value={goal.progress_percentage}
                      indicatorClassName={
                        isCompleted
                          ? "bg-emerald-500"
                          : isActivity
                          ? "bg-amber-500"
                          : "bg-purple-500"
                      }
                      className="h-2"
                    />

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-muted-foreground">
                        <strong className="text-foreground font-semibold">
                          {formatPoints(goal.current_points)}
                        </strong>{" "}
                        / {formatPoints(goal.target_points)} pts
                      </span>

                      {goal.target_date && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(goal.target_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions for Captain / VC */}
                  {canManageGoals && (
                    <div className="pt-2 border-t border-border/60 flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => {
                          setEditingGoal(goal);
                          setIsEditOpen(true);
                        }}
                        className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="mr-1 h-3 w-3" />
                        Edit
                      </Button>

                      {goal.status === "completed" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLoading}
                          onClick={() => handleToggleStatus(goal.id, "active")}
                          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          <RotateCcw className="mr-1 h-3 w-3" />
                          Reopen
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isLoading}
                          onClick={() => handleToggleStatus(goal.id, "completed")}
                          className="h-7 px-2 text-[11px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Complete
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleToggleStatus(goal.id, "archived")}
                        className="h-7 px-2 text-[11px] text-destructive/80 hover:text-destructive"
                      >
                        <Archive className="mr-1 h-3 w-3" />
                        Archive
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
