"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, ArrowRight, UserX, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoleBadge } from "@/components/ui/role-badge";
import { GoalWithProgress, UserRole } from "@/types/domain";

export interface AttentionMember {
  id: string;
  full_name: string;
  role: UserRole;
  status: string;
  activity_points: number;
  reward_points: number;
}

interface NeedsAttentionCardProps {
  members: AttentionMember[];
  individualGoals?: GoalWithProgress[];
  unupdatedMemberIds?: string[];
  declinedMembers?: { memberId: string; declineAmount: number }[];
}

interface AttentionItem {
  member: AttentionMember;
  reason: string;
  severity: "warning" | "destructive" | "info";
  detail: string;
}

export function NeedsAttentionCard({
  members,
  individualGoals = [],
  unupdatedMemberIds = [],
  declinedMembers = [],
}: NeedsAttentionCardProps) {
  // Analyze real database conditions:
  const attentionItems: AttentionItem[] = [];

  // Condition 1: Inactive members
  members.forEach((m) => {
    if (m.status === "inactive") {
      attentionItems.push({
        member: m,
        reason: "Inactive Account",
        severity: "destructive",
        detail: "Member status is set to inactive.",
      });
    }
  });

  // Condition 2: Active members who missed Saturday update
  unupdatedMemberIds.forEach((id) => {
    const mem = members.find((m) => m.id === id);
    if (mem && mem.status === "active") {
      attentionItems.push({
        member: mem,
        reason: "Missed Saturday Update",
        severity: "warning",
        detail: "Did not submit Saturday points update for the weekly report.",
      });
    }
  });

  // Condition 3: Active members with 0 activity points
  members.forEach((m) => {
    if (m.status === "active" && (m.activity_points || 0) === 0) {
      const alreadyListed = attentionItems.some((i) => i.member.id === m.id);
      if (!alreadyListed) {
        attentionItems.push({
          member: m,
          reason: "Zero Activity Points",
          severity: "warning",
          detail: "No active task points recorded on ledger.",
        });
      }
    }
  });

  // Condition 4: Significant point decline
  declinedMembers.forEach((d) => {
    const mem = members.find((m) => m.id === d.memberId);
    if (mem && mem.status === "active") {
      attentionItems.push({
        member: mem,
        reason: "Point Decline",
        severity: "warning",
        detail: `Balance declined by ${d.declineAmount} pts from previous week snapshot.`,
      });
    }
  });

  // Condition 5: Members behind on assigned individual targets (< 50% progress)
  individualGoals.forEach((goal) => {
    if (
      goal.scope === "individual" &&
      goal.status === "active" &&
      goal.target_member_id &&
      goal.progress_percentage < 50
    ) {
      const targetMember = members.find((m) => m.id === goal.target_member_id);
      if (targetMember && targetMember.status === "active") {
        const alreadyListed = attentionItems.some(
          (item) => item.member.id === targetMember.id && item.reason === "Behind on Target"
        );
        if (!alreadyListed) {
          attentionItems.push({
            member: targetMember,
            reason: "Behind on Target",
            severity: "warning",
            detail: `${goal.title}: ${goal.current_points} / ${goal.target_points} pts (${goal.progress_percentage}%)`,
          });
        }
      }
    }
  });

  return (
    <Card className="border-border/70 flex flex-col justify-between shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Needs Attention
            </CardTitle>
            <CardDescription className="text-xs">
              Live alerts based on member activity, updates, and milestones
            </CardDescription>
          </div>
          {attentionItems.length > 0 && (
            <Badge variant="warning" className="text-[10px]">
              {attentionItems.length} {attentionItems.length === 1 ? "Issue" : "Issues"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {attentionItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">Everything looks good</p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-[260px]">
              No members currently require immediate attention or point intervention.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {attentionItems.slice(0, 5).map((item, index) => (
              <div
                key={`${item.member.id}-${index}`}
                className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 gap-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link
                      href={`/profile/${item.member.id}`}
                      className="text-xs font-semibold text-foreground hover:underline truncate"
                    >
                      {item.member.full_name}
                    </Link>
                    <RoleBadge role={item.member.role} size="sm" />
                    <Badge
                      variant={item.severity === "destructive" ? "destructive" : "warning"}
                      className="text-[9px] px-1.5 py-0"
                    >
                      {item.reason}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {item.detail}
                  </p>
                </div>

                <Link
                  href={`/profile/${item.member.id}`}
                  className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
                  title="View Profile"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
