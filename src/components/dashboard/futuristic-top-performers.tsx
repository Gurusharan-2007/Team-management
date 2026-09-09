"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatPoints, getInitials } from "@/lib/utils";
import { Star } from "lucide-react";
import { UserRole, ROLE_LABELS } from "@/types/domain";

export interface TopPerformerItem {
  id: string;
  full_name: string;
  role: UserRole;
  activity_points?: number;
  reward_points?: number;
  avatar_url?: string | null;
}

interface FuturisticTopPerformersProps {
  members?: TopPerformerItem[];
}

export function FuturisticTopPerformers({ members = [] }: FuturisticTopPerformersProps) {
  const sortedMembers = [...members]
    .map((m) => ({
      ...m,
      totalScore: (m.activity_points || 0) + (m.reward_points || 0),
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 8);

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-[11px] text-white shadow-[0_0_10px_rgba(245,158,11,0.5)]">
          1
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-400 font-bold text-[11px] text-white shadow-[0_0_10px_rgba(148,163,184,0.5)]">
          2
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-700 font-bold text-[11px] text-white shadow-[0_0_10px_rgba(180,83,9,0.5)]">
          3
        </span>
      );
    }
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted dark:bg-white/[0.08] border border-border dark:border-white/10 font-medium text-[10px] text-muted-foreground dark:text-slate-300">
        {index + 1}
      </span>
    );
  };

  return (
    <div className="glass-panel-dark relative overflow-hidden rounded-2xl p-5 select-none flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60 dark:border-white/[0.06]">
        <h3 className="text-sm font-bold tracking-tight text-foreground">
          Top Performers
        </h3>
        <Link
          href="/leaderboard"
          className="text-xs font-semibold text-blue-500 dark:text-blue-400 hover:underline transition-colors"
        >
          View All
        </Link>
      </div>

      {/* Ranked Members List */}
      <div className="mt-2 divide-y divide-border/40 dark:divide-white/[0.04]">
        {sortedMembers.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
            <div className="h-9 w-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Star className="h-4.5 w-4.5" />
            </div>
            <p className="text-xs font-semibold text-foreground">No Members Yet</p>
            <p className="text-[11px] text-muted-foreground max-w-[200px] leading-relaxed">
              Active team members and their ranking points will appear here.
            </p>
          </div>
        ) : (
          sortedMembers.map((member, index) => {
          return (
            <Link
              key={member.id}
              href={`/profile/${member.id}`}
              className="flex items-center justify-between py-2 px-1.5 rounded-xl hover:bg-muted/40 dark:hover:bg-white/[0.05] transition-all duration-150 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {getRankBadge(index)}
                <Avatar className="h-6.5 w-6.5 rounded-full border border-border/60 dark:border-white/20">
                  {member.avatar_url && (
                    <AvatarImage src={member.avatar_url} alt={member.full_name} />
                  )}
                  <AvatarFallback className="text-[10px] font-semibold bg-gradient-to-tr from-blue-600 to-indigo-600 text-white">
                    {getInitials(member.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground group-hover:text-primary dark:group-hover:text-blue-300 transition-colors truncate leading-tight">
                    {member.full_name}
                  </div>
                  <div className="text-[10px] text-muted-foreground capitalize leading-tight">
                    {ROLE_LABELS[member.role] || member.role}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400 shrink-0">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>{formatPoints(member.totalScore)}</span>
              </div>
            </Link>
          );
        })
      )}
      </div>
    </div>
  );
}
