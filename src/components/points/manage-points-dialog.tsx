"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Award,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Sliders,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { PointType } from "@/types/domain";
import { adjustPointsAction } from "@/actions/points";
import { formatPoints } from "@/lib/utils";

interface ManagePointsDialogProps {
  targetMemberId: string;
  targetMemberName: string;
  currentActivityPoints: number;
  currentRewardPoints: number;
  isSelfUpdate?: boolean;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function ManagePointsDialog({
  targetMemberId,
  targetMemberName,
  currentActivityPoints,
  currentRewardPoints,
  isSelfUpdate = false,
  trigger,
  onSuccess,
}: ManagePointsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const [pointType, setPointType] = React.useState<PointType>("activity");
  const [action, setAction] = React.useState<"add" | "remove">("add");
  const [amount, setAmount] = React.useState<string>("10");
  const [reason, setReason] = React.useState<string>("");

  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const currentBalance =
    pointType === "activity" ? currentActivityPoints : currentRewardPoints;

  const numericAmount = Math.max(0, parseInt(amount, 10) || 0);
  const resultingBalance =
    action === "add"
      ? currentBalance + numericAmount
      : currentBalance - numericAmount;

  const isNegativeViolation = action === "remove" && resultingBalance < 0;

  const resetForm = () => {
    setPointType("activity");
    setAction("add");
    setAmount("10");
    setReason("");
    setMessage(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Client validation
    if (numericAmount <= 0) {
      setMessage({ type: "error", text: "Point amount must be greater than 0." });
      return;
    }

    if (isNegativeViolation) {
      setMessage({
        type: "error",
        text: `Operation rejected: Balance cannot become negative (current: ${currentBalance}, requested deduction: ${numericAmount}).`,
      });
      return;
    }

    const trimmedReason = reason.trim();
    if (trimmedReason.length < 3) {
      setMessage({ type: "error", text: "Please enter a specific reason (at least 3 characters)." });
      return;
    }

    setLoading(true);

    const result = await adjustPointsAction({
      targetUserId: targetMemberId,
      pointType,
      action,
      amount: numericAmount,
      reason: trimmedReason,
    });

    setLoading(false);

    if (result.success) {
      setMessage({
        type: "success",
        text: result.message || "Points updated successfully.",
      });
      if (onSuccess) onSuccess();

      setTimeout(() => {
        setOpen(false);
        resetForm();
        router.refresh();
      }, 1000);
    } else {
      setMessage({
        type: "error",
        text: result.error || "Failed to adjust points.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="text-xs">
            <Sliders className="mr-1.5 h-3.5 w-3.5" />
            {isSelfUpdate ? "Update My Points" : "Manage Points"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{isSelfUpdate ? "Log / Update Points" : "Manage Member Points"}</span>
            <Badge variant="subtle" className="font-mono text-xs">
              {pointType === "activity" ? "Activity Points" : "Reward Points"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {isSelfUpdate
              ? "Submit verified points for your own contributions. Reason is required for weekly reporting audit trail."
              : `Adjust verified points for ${targetMemberName}. All point adjustments are atomic and logged to the audit log.`}
          </DialogDescription>
        </DialogHeader>

        {message && (
          <div
            className={`flex items-center gap-2 rounded-md p-3 text-xs ${
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

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Current Balance & Resulting Balance Preview */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/80 bg-muted/30 p-3">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-muted-foreground">Current Balance</span>
              <div className="font-mono text-base font-bold text-foreground">
                {formatPoints(currentBalance)}
              </div>
            </div>

            <div className="space-y-0.5 text-right">
              <span className="text-[11px] font-medium text-muted-foreground">New Balance</span>
              <div
                className={`font-mono text-base font-bold ${
                  isNegativeViolation
                    ? "text-destructive"
                    : action === "add"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-foreground"
                }`}
              >
                {formatPoints(Math.max(0, resultingBalance))}
                {isNegativeViolation && (
                  <span className="block text-[10px] text-destructive font-normal">
                    Invalid (negative)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Point Type & Action Selectors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Point Type</label>
              <Select
                value={pointType}
                onValueChange={(val: PointType) => setPointType(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activity" className="text-xs">
                    Activity Points
                  </SelectItem>
                  <SelectItem value="reward" className="text-xs">
                    Reward Points
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Action</label>
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <Button
                  type="button"
                  variant={action === "add" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAction("add")}
                  className="h-8 text-xs font-medium"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add
                </Button>
                <Button
                  type="button"
                  variant={action === "remove" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setAction("remove")}
                  className="h-8 text-xs font-medium"
                >
                  <Minus className="mr-1 h-3.5 w-3.5" />
                  Remove
                </Button>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label htmlFor="amount" className="text-xs font-medium text-foreground">
              Amount (Points)
            </label>
            <Input
              id="amount"
              type="number"
              min="1"
              max="100000"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 10"
              className="h-9 text-xs font-mono"
              required
            />
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="reason" className="text-xs font-medium text-foreground">
                Reason &amp; Task Reference <span className="text-destructive">*</span>
              </label>
              <span className="text-[10px] text-muted-foreground font-mono">
                {reason.length}/500
              </span>
            </div>
            <textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isSelfUpdate
                  ? "e.g. Completed technical workshop on Next.js Server Actions and submitted code review"
                  : "e.g. Leadership honor for organizing weekend campus hackathon"
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
              maxLength={500}
            />
          </div>

          {isNegativeViolation && (
            <div className="flex items-center gap-2 rounded-md p-2.5 text-[11px] bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                Deduction of {numericAmount} exceeds current balance of {currentBalance}. Negative balances are strictly rejected.
              </span>
            </div>
          )}

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
            <Button
              type="submit"
              size="sm"
              loading={loading}
              disabled={isNegativeViolation || numericAmount <= 0 || reason.trim().length < 3}
            >
              {action === "add" ? "Add Points" : "Deduct Points"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
