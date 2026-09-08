"use client";

import * as React from "react";
import {
  Clock,
  Zap,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  User,
  ShieldAlert,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PointHistoryItemWithActor, PointType } from "@/types/domain";
import { formatDateTime, formatPoints } from "@/lib/utils";

interface PointHistorySectionProps {
  initialHistory: PointHistoryItemWithActor[];
  memberId: string;
  memberName: string;
}

export function PointHistorySection({
  initialHistory,
  memberName,
}: PointHistorySectionProps) {
  const [filterType, setFilterType] = React.useState<"all" | PointType>("all");
  const [sortOrder, setSortOrder] = React.useState<"newest" | "oldest">("newest");

  const filteredHistory = React.useMemo(() => {
    return initialHistory
      .filter((item) => {
        if (filterType === "all") return true;
        return item.point_type === filterType;
      })
      .sort((a, b) => {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
      });
  }, [initialHistory, filterType, sortOrder]);

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold">Point Audit History</CardTitle>
            <Badge variant="subtle" className="font-mono text-xs">
              {filteredHistory.length} Events
            </Badge>
          </div>
          <CardDescription>
            Immutable chronological ledger of Activity and Reward Point changes.
          </CardDescription>
        </div>

        {/* Filters and Sorting Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Point Type Filter */}
          <Select
            value={filterType}
            onValueChange={(val: "all" | PointType) => setFilterType(val)}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="All Points" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All Points
              </SelectItem>
              <SelectItem value="activity" className="text-xs">
                Activity Points
              </SelectItem>
              <SelectItem value="reward" className="text-xs">
                Reward Points
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Select
            value={sortOrder}
            onValueChange={(val: "newest" | "oldest") => setSortOrder(val)}
          >
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <ArrowUpDown className="mr-1.5 h-3 w-3 opacity-60" />
              <SelectValue placeholder="Sort Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest" className="text-xs">
                Newest First
              </SelectItem>
              <SelectItem value="oldest" className="text-xs">
                Oldest First
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredHistory.length === 0 ? (
          <EmptyState
            icon={Clock}
            badgeText="Immutable Audit Log"
            title="No Point Changes Recorded"
            description="All verified point additions, deductions, and self-updates will appear in this ledger."
            className="py-10 border-dashed"
          />
        ) : (
          <div className="divide-y divide-border/60 rounded-lg border border-border/70 overflow-hidden bg-card">
            {filteredHistory.map((item) => {
              const isPositive = item.change_amount > 0;
              const formattedAmount = `${isPositive ? "+" : ""}${item.change_amount}`;
              const actorLabel =
                item.actor?.full_name ||
                (item.actor_role
                  ? item.actor_role.replace("_", " ").toUpperCase()
                  : "System");

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-semibold ${
                        isPositive
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-destructive/20 bg-destructive/10 text-destructive"
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-mono text-xs font-bold ${
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-destructive"
                          }`}
                        >
                          {formattedAmount}{" "}
                          {item.point_type === "activity"
                            ? "Activity Points"
                            : "Reward Points"}
                        </span>

                        <Badge
                          variant={item.source === "self_update" ? "subtle" : "outline"}
                          className="text-[10px] px-1.5 py-0 capitalize"
                        >
                          {item.source === "self_update" ? "Self Update" : "Admin Adjustment"}
                        </Badge>
                      </div>

                      <p className="text-xs text-foreground font-medium">
                        {item.reason}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 opacity-70" />
                          Changed by {actorLabel}
                        </span>
                        <span>•</span>
                        <span className="font-mono">
                          {item.previous_value} → {item.new_value} pts
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-muted-foreground font-mono shrink-0 pl-10 sm:pl-0 sm:text-right">
                    {formatDateTime(item.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
