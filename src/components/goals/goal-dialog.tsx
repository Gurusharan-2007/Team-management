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
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GoalScope, GoalStatus, GoalWithProgress, PointType } from "@/types/domain";
import { createGoalAction, updateGoalAction } from "@/actions/goals";

interface MemberOption {
  id: string;
  full_name: string;
  role: string;
}

interface GoalDialogProps {
  goalToEdit?: GoalWithProgress | null;
  activeMembers?: MemberOption[];
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function GoalDialog({
  goalToEdit,
  activeMembers = [],
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
}: GoalDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const isEditing = Boolean(goalToEdit);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [pointType, setPointType] = React.useState<PointType>("activity");
  const [targetPoints, setTargetPoints] = React.useState("100");
  const [scope, setScope] = React.useState<GoalScope>("team");
  const [targetMemberId, setTargetMemberId] = React.useState("");
  const [status, setStatus] = React.useState<GoalStatus>("active");
  const [targetDate, setTargetDate] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync state when editing an existing goal
  React.useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title || "");
      setDescription(goalToEdit.description || "");
      setPointType(goalToEdit.point_type || "activity");
      setTargetPoints(String(goalToEdit.target_points || 100));
      setScope(goalToEdit.scope || "team");
      setTargetMemberId(goalToEdit.target_member_id || "");
      setStatus(goalToEdit.status || "active");
      setTargetDate(goalToEdit.target_date ? goalToEdit.target_date.slice(0, 10) : "");
    } else {
      setTitle("");
      setDescription("");
      setPointType("activity");
      setTargetPoints("100");
      setScope("team");
      setTargetMemberId(activeMembers[0]?.id || "");
      setStatus("active");
      setTargetDate("");
    }
    setMessage(null);
  }, [goalToEdit, activeMembers, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const parsedPoints = parseInt(targetPoints, 10);
    if (isNaN(parsedPoints) || parsedPoints <= 0) {
      setMessage({ type: "error", text: "Target points must be a positive number greater than 0." });
      return;
    }

    if (!title.trim() || title.trim().length < 3) {
      setMessage({ type: "error", text: "Title must be at least 3 characters long." });
      return;
    }

    if (scope === "individual" && !targetMemberId) {
      setMessage({ type: "error", text: "Please select an assigned member for this individual goal." });
      return;
    }

    setLoading(true);

    try {
      if (isEditing && goalToEdit) {
        const res = await updateGoalAction({
          goalId: goalToEdit.id,
          title,
          description,
          pointType,
          targetPoints: parsedPoints,
          scope,
          targetMemberId: scope === "individual" ? targetMemberId : undefined,
          status,
          targetDate: targetDate || undefined,
        });

        if (!res.success) {
          setMessage({ type: "error", text: res.error || "Failed to update goal." });
          setLoading(false);
          return;
        }

        setMessage({ type: "success", text: "Target successfully updated." });
      } else {
        const res = await createGoalAction({
          title,
          description,
          pointType,
          targetPoints: parsedPoints,
          scope,
          targetMemberId: scope === "individual" ? targetMemberId : undefined,
          targetDate: targetDate || undefined,
        });

        if (!res.success) {
          setMessage({ type: "error", text: res.error || "Failed to create goal." });
          setLoading(false);
          return;
        }

        setMessage({ type: "success", text: "Target successfully created." });
      }

      setTimeout(() => {
        setOpen(false);
        router.refresh();
        onSuccess?.();
      }, 700);
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {isEditing ? "Edit Goal / Target" : "Create New Goal / Target"}
            </DialogTitle>
            <DialogDescription>
              Define performance milestones for the team or assign tailored targets to specific members.
            </DialogDescription>
          </DialogHeader>

          {message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-md text-xs ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="space-y-3">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Goal Title <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g., Sprint Technical Milestone"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                required
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Description <span className="text-muted-foreground text-[11px]">(optional)</span>
              </label>
              <Input
                placeholder="Brief objective or criteria for completion"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Scope */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  Scope
                </label>
                <Select
                  value={scope}
                  onValueChange={(val) => setScope(val as GoalScope)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team">Whole Team</SelectItem>
                    <SelectItem value="individual">Individual Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Point Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  {pointType === "activity" ? (
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                  ) : (
                    <Award className="h-3.5 w-3.5 text-purple-500" />
                  )}
                  Point Metric
                </label>
                <Select
                  value={pointType}
                  onValueChange={(val) => setPointType(val as PointType)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select point type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activity">Activity Points</SelectItem>
                    <SelectItem value="reward">Reward Points</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Individual Member Picker (if scope is individual) */}
            {scope === "individual" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Target Member <span className="text-destructive">*</span>
                </label>
                <Select
                  value={targetMemberId}
                  onValueChange={setTargetMemberId}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assigned member" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name} ({member.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Target Points */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Target Points <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={targetPoints}
                  onChange={(e) => setTargetPoints(e.target.value)}
                  placeholder="e.g. 100"
                  required
                  disabled={loading}
                />
              </div>

              {/* Target Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Target Date <span className="text-muted-foreground text-[11px]">(optional)</span>
                </label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Status (when editing) */}
            {isEditing && (
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-medium text-foreground">Status</label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as GoalStatus)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived / Deactivated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                ? "Save Changes"
                : "Create Target"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
