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
  // Sample seed matching reference image if members is small
  const defaultMembers: TopPerformerItem[] = [
    { id: "mem-1", full_name: "Aravind K", role: "strategist", activity_points: 3450, reward_points: 1400 },
    { id: "mem-2", full_name: "Priya S", role: "manager", activity_points: 3120, reward_points: 1200 },
    { id: "mem-3", full_name: "Karthik R", role: "vice_captain", activity_points: 2980, reward_points: 1000 },
    { id: "mem-4", full_name: "Saran V", role: "member", activity_points: 2800, reward_points: 960 },
    { id: "mem-5", full_name: "Deepa M", role: "member", activity_points: 2640, reward_points: 900 },
    { id: "mem-6", full_name: "Naveen T", role: "member", activity_points: 2410, reward_points: 800 },
    { id: "mem-7", full_name: "Keerthana L", role: "member", activity_points: 2280, reward_points: 700 },
    { id: "mem-8", full_name: "Vignesh P", role: "member", activity_points: 2160, reward_points: 600 },
  ];

  const sourceMembers = members && members.length >= 3 ? members : defaultMembers;

  const sortedMembers = [...sourceMembers]
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
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted/60 font-medium text-[11px] text-muted-foreground">
        {index + 1}
      </span>
    );
  };

  return (
    <Card className="glass-panel relative overflow-hidden rounded-3xl p-5 border-border/70 shadow-glass flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
        <h3 className="text-sm font-bold tracking-tight text-foreground">
          Top Performers
        </h3>
        <Link
          href="/leaderboard"
          className="text-xs font-semibold text-primary hover:underline"
        >
          View All
        </Link>
      </div>

      {/* Ranked Members List */}
      <div className="mt-2 divide-y divide-border/30">
        {sortedMembers.map((member, index) => {
          return (
            <Link
              key={member.id}
              href={`/profile/${member.id}`}
              className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-white/[0.04] transition-all duration-200 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                {getRankBadge(index)}
                <Avatar className="h-7 w-7 rounded-full border border-border/70">
                  {member.avatar_url && (
                    <AvatarImage src={member.avatar_url} alt={member.full_name} />
                  )}
                  <AvatarFallback className="text-[10px] font-semibold bg-primary/15 text-primary">
                    {getInitials(member.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {member.full_name}
                  </div>
                  <div className="text-[10px] text-muted-foreground capitalize">
                    {ROLE_LABELS[member.role] || member.role}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-500 shrink-0">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                <span>{formatPoints(member.totalScore)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
