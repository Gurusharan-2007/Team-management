import * as React from "react";
import Link from "next/link";
import { TrendingUp, Sparkles, Calendar, Zap, Award, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/role-badge";
import { UserRole } from "@/types/domain";
import { formatPoints, getInitials } from "@/lib/utils";

export interface MostImprovedData {
  member_id: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
  activity_delta: number;
  reward_delta: number;
  total_delta: number;
  percentage_increase: number | null;
  week_label: string;
}

interface MostImprovedCardProps {
  improvedMember?: MostImprovedData | null;
}

export function MostImprovedCard({ improvedMember }: MostImprovedCardProps) {
  const hasData = improvedMember && improvedMember.total_delta > 0;

  return (
    <Card className="border-border flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Most Improved
            </CardTitle>
            <CardDescription className="text-xs">
              Weekly momentum &amp; point acceleration
            </CardDescription>
          </div>
          <Badge variant="subtle" className="text-[10px]">
            {hasData ? improvedMember.week_label : "Step 6 Automated"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {hasData ? (
          <div className="space-y-3 py-1">
            <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.03]">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="h-9 w-9 border-2 border-emerald-500/30">
                  {improvedMember.avatar_url && (
                    <AvatarImage src={improvedMember.avatar_url} alt={improvedMember.full_name} />
                  )}
                  <AvatarFallback className="text-xs font-semibold bg-muted">
                    {getInitials(improvedMember.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/team/${improvedMember.member_id}`}
                      className="text-xs font-bold text-foreground hover:underline truncate"
                    >
                      {improvedMember.full_name}
                    </Link>
                    <RoleBadge role={improvedMember.role} size="sm" />
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <ArrowUpRight className="h-3 w-3" />
                    +{formatPoints(improvedMember.total_delta)} pts this week
                    {improvedMember.percentage_increase !== null && (
                      <span className="text-muted-foreground font-normal">
                        (+{improvedMember.percentage_increase}%)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 font-mono text-xs">
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold justify-end">
                  <Zap className="h-3 w-3" />
                  +{improvedMember.activity_delta}
                </div>
                {improvedMember.reward_delta > 0 && (
                  <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold justify-end text-[11px]">
                    <Award className="h-3 w-3" />
                    +{improvedMember.reward_delta}
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Highest net points growth recorded between previous and current reporting week snapshots.
            </p>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Historical records</span>
              <Link
                href="/reports"
                className="font-medium text-foreground hover:underline flex items-center gap-1 text-[11px]"
              >
                View Weekly Reports
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Most Improved will appear after enough weekly reports are recorded.
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
              Weekly delta tracking activates automatically once scheduled Saturday snapshot reports begin recording.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md">
              <Calendar className="h-3 w-3" />
              <span>Saturday automated reporting cycle</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
