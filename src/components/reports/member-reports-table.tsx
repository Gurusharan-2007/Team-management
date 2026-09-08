import * as React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/role-badge";
import { Badge } from "@/components/ui/badge";
import { MemberWeeklyReportWithProfile } from "@/types/domain";
import { formatPoints, getInitials } from "@/lib/utils";
import { CheckCircle2, Clock, ArrowUpRight, ArrowDownRight, ArrowRight } from "lucide-react";

interface MemberReportsTableProps {
  memberReports: MemberWeeklyReportWithProfile[];
  isLeadershipView: boolean;
}

export function MemberReportsTable({
  memberReports,
  isLeadershipView,
}: MemberReportsTableProps) {
  if (memberReports.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground">
        No member snapshot records available for this weekly report.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
            <tr>
              <th className="px-4 py-3 font-semibold">Member</th>
              <th className="px-4 py-3 font-semibold">Activity Points</th>
              <th className="px-4 py-3 font-semibold">Reward Points</th>
              <th className="px-4 py-3 font-semibold">Courses</th>
              <th className="px-4 py-3 font-semibold">Saturday Status</th>
              <th className="px-4 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {memberReports.map((report) => {
              const member = report.member;
              const hasPrevAct = report.activity_change !== null && report.activity_change !== undefined;
              const hasPrevRew = report.reward_change !== null && report.reward_change !== undefined;

              return (
                <tr key={report.id} className="hover:bg-muted/30 transition-colors">
                  {/* Member Name & Role */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7">
                        {member?.avatar_url && (
                          <AvatarImage src={member.avatar_url} alt={member.full_name} />
                        )}
                        <AvatarFallback className="text-[10px] font-semibold bg-muted">
                          {getInitials(member?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground truncate">
                            {member?.full_name || "Team Member"}
                          </span>
                          {member?.role && <RoleBadge role={member.role} size="sm" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {member?.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Activity Points Snapshot */}
                  <td className="px-4 py-3 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-foreground">
                        {formatPoints(report.activity_points)} pts
                      </span>
                      {hasPrevAct && (
                        <span
                          className={`text-[10px] flex items-center ${
                            report.activity_change! >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-destructive"
                          }`}
                        >
                          {report.activity_change! >= 0 ? (
                            <ArrowUpRight className="h-2.5 w-2.5" />
                          ) : (
                            <ArrowDownRight className="h-2.5 w-2.5" />
                          )}
                          {report.activity_change! >= 0 ? "+" : ""}
                          {report.activity_change}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Reward Points Snapshot */}
                  <td className="px-4 py-3 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-foreground">
                        {formatPoints(report.reward_points)} pts
                      </span>
                      {hasPrevRew && (
                        <span
                          className={`text-[10px] flex items-center ${
                            report.reward_change! >= 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-destructive"
                          }`}
                        >
                          {report.reward_change! >= 0 ? (
                            <ArrowUpRight className="h-2.5 w-2.5" />
                          ) : (
                            <ArrowDownRight className="h-2.5 w-2.5" />
                          )}
                          {report.reward_change! >= 0 ? "+" : ""}
                          {report.reward_change}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Courses Completed */}
                  <td className="px-4 py-3 font-mono">
                    <span className="text-foreground font-semibold">
                      {report.courses_completed}
                    </span>
                  </td>

                  {/* Saturday Status */}
                  <td className="px-4 py-3">
                    {report.updated_on_saturday ? (
                      <Badge variant="success" className="text-[10px] gap-1 px-1.5 py-0">
                        <CheckCircle2 className="h-3 w-3" />
                        Updated
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px] gap-1 px-1.5 py-0">
                        <Clock className="h-3 w-3" />
                        Not Updated
                      </Badge>
                    )}
                  </td>

                  {/* Action Link */}
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/team/${report.member_id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground hover:underline"
                    >
                      Profile
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
