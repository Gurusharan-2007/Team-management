"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Achievement, AchievementType } from "@/types/domain";
import {
  AVAILABLE_ACHIEVEMENT_ICONS,
  AchievementIcon,
} from "./achievement-icon";
import {
  createAchievementAction,
  updateAchievementAction,
} from "@/actions/achievements";
import { AlertCircle, CheckCircle2, Award } from "lucide-react";

interface AchievementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  achievement?: Achievement | null;
  onSuccess?: () => void;
}

const ACHIEVEMENT_TYPES: { id: AchievementType; label: string; description: string }[] = [
  {
    id: "activity_points",
    label: "Activity Points",
    description: "Earned when cumulative Activity Points reach or exceed threshold.",
  },
  {
    id: "reward_points",
    label: "Reward Points",
    description: "Earned when cumulative Reward Points reach or exceed threshold.",
  },
  {
    id: "courses_completed",
    label: "Technical Courses Completed",
    description: "Earned when total completed courses reach threshold.",
  },
  {
    id: "goal_completed",
    label: "Goals Achieved",
    description: "Earned when completed goals count reaches threshold.",
  },
  {
    id: "weekly_updates",
    label: "Consistent Saturday Updates",
    description: "Earned when submitted Saturday updates reach threshold.",
  },
  {
    id: "improvement",
    label: "Weekly Points Improvement Delta",
    description: "Earned when points improvement from prior week reaches threshold.",
  },
];

export function AchievementDialog({
  open,
  onOpenChange,
  achievement,
  onSuccess,
}: AchievementDialogProps) {
  const isEditing = Boolean(achievement);

  const [name, setName] = useState(achievement?.name || "");
  const [description, setDescription] = useState(achievement?.description || "");
  const [achievementType, setAchievementType] = useState<AchievementType>(
    achievement?.achievement_type || "activity_points"
  );
  const [threshold, setThreshold] = useState<number>(achievement?.threshold ?? 50);
  const [icon, setIcon] = useState(achievement?.icon || "award");
  const [active, setActive] = useState(achievement?.active ?? true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state when dialog opens with a specific achievement
  React.useEffect(() => {
    if (achievement) {
      setName(achievement.name);
      setDescription(achievement.description);
      setAchievementType(achievement.achievement_type);
      setThreshold(achievement.threshold);
      setIcon(achievement.icon);
      setActive(achievement.active);
    } else {
      setName("");
      setDescription("");
      setAchievementType("activity_points");
      setThreshold(50);
      setIcon("award");
      setActive(true);
    }
    setError(null);
    setSuccessMsg(null);
  }, [achievement, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 3 || trimmedName.length > 60) {
      setError("Name must be between 3 and 60 characters.");
      return;
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc || trimmedDesc.length < 5 || trimmedDesc.length > 255) {
      setError("Description must be between 5 and 255 characters.");
      return;
    }

    if (isNaN(threshold) || threshold < 0) {
      setError("Threshold must be a non-negative number.");
      return;
    }

    setLoading(true);

    try {
      if (isEditing && achievement) {
        const res = await updateAchievementAction({
          id: achievement.id,
          name: trimmedName,
          description: trimmedDesc,
          icon,
          achievementType,
          threshold: Number(threshold),
          active,
        });

        if (!res.success) {
          setError(res.error || "Failed to update achievement.");
        } else {
          setSuccessMsg("Achievement updated successfully.");
          setTimeout(() => {
            onOpenChange(false);
            onSuccess?.();
          }, 600);
        }
      } else {
        const res = await createAchievementAction({
          name: trimmedName,
          description: trimmedDesc,
          icon,
          achievementType,
          threshold: Number(threshold),
          active,
        });

        if (!res.success) {
          setError(res.error || "Failed to create achievement.");
        } else {
          setSuccessMsg("Achievement definition created.");
          setTimeout(() => {
            onOpenChange(false);
            onSuccess?.();
          }, 600);
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Award className="w-5 h-5 text-primary" />
            {isEditing ? "Edit Milestone Definition" : "Create Milestone Definition"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure automated milestone criteria. Note: Manual awards are forbidden; milestones are unlocked automatically via verified system events.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 text-sm">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Milestone Name <span className="text-destructive">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 500 Activity Points, Course Scholar"
              required
              disabled={loading}
              maxLength={60}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Description <span className="text-destructive">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Reached 500 cumulative activity points across team contributions."
              required
              disabled={loading}
              rows={2}
              maxLength={255}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Type and Threshold Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Achievement Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Evaluation Metric <span className="text-destructive">*</span>
              </label>
              <select
                value={achievementType}
                onChange={(e) => setAchievementType(e.target.value as AchievementType)}
                disabled={loading}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {ACHIEVEMENT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Threshold */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Threshold Requirement <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min={0}
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value) || 0)}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Icon Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Select Icon</label>
            <div className="grid grid-cols-6 gap-2 p-2 border border-border rounded-lg bg-muted/20">
              {AVAILABLE_ACHIEVEMENT_ICONS.map((item) => {
                const isSelected = icon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcon(item.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-md border transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    title={item.label}
                  >
                    <AchievementIcon name={item.id} className="w-4 h-4 mb-1" />
                    <span className="text-[9px] truncate w-full text-center">
                      {item.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
            <div>
              <div className="text-xs font-medium text-foreground">Active Milestone</div>
              <div className="text-[11px] text-muted-foreground">
                When active, eligible members unlock this achievement automatically.
              </div>
            </div>
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 text-primary rounded border-input"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Create Milestone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
