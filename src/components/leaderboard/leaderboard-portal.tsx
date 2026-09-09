"use client";

import React, { useState, useTransition } from "react";
import {
  LeaderboardCategory,
  LeaderboardEntry,
  LeaderboardPeriod,
  PersonalRankSummary,
  AchievementWithStatus,
  Achievement,
  UserRole,
} from "@/types/domain";
import { LeaderboardTable } from "./leaderboard-table";
import { PersonalRankBanner } from "./personal-rank-banner";
import { AchievementsGrid } from "@/components/achievements/achievements-grid";
import { AchievementAdminSection } from "@/components/achievements/achievement-admin-section";
import { getLeaderboardAction } from "@/actions/leaderboard";
import { getAchievementsCatalogAction } from "@/actions/achievements";
import { Trophy, Award, Settings2, Sparkles, Loader2 } from "lucide-react";
import { isLeadership } from "@/lib/auth/permissions";

interface LeaderboardPortalProps {
  initialEntries: LeaderboardEntry[];
  initialCategory: LeaderboardCategory;
  initialPeriod: LeaderboardPeriod;
  personalRank: PersonalRankSummary | null;
  achievementsCatalog: AchievementWithStatus[];
  currentUserId: string;
  userRole: UserRole;
  userName: string;
}

export function LeaderboardPortal({
  initialEntries,
  initialCategory,
  initialPeriod,
  personalRank,
  achievementsCatalog: initialCatalog,
  currentUserId,
  userRole,
  userName,
}: LeaderboardPortalProps) {
  const [activeTab, setActiveTab] = useState<"rankings" | "achievements" | "admin">("rankings");
  const [category, setCategory] = useState<LeaderboardCategory>(initialCategory);
  const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod);
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialEntries);
  const [catalog, setCatalog] = useState<AchievementWithStatus[]>(initialCatalog);
  const [isPending, startTransition] = useTransition();

  const isLeader = isLeadership(userRole);

  const handleCategoryChange = (newCategory: LeaderboardCategory) => {
    setCategory(newCategory);
    startTransition(async () => {
      const res = await getLeaderboardAction({ category: newCategory, period });
      if (res.success && res.entries) {
        setEntries(res.entries);
      }
    });
  };

  const handlePeriodChange = (newPeriod: LeaderboardPeriod) => {
    setPeriod(newPeriod);
    startTransition(async () => {
      const res = await getLeaderboardAction({ category, period: newPeriod });
      if (res.success && res.entries) {
        setEntries(res.entries);
      }
    });
  };

  const refreshCatalog = async () => {
    startTransition(async () => {
      const res = await getAchievementsCatalogAction(currentUserId);
      if (res.success && res.catalog) {
        setCatalog(res.catalog);
      }
      const lbRes = await getLeaderboardAction({ category, period });
      if (lbRes.success && lbRes.entries) {
        setEntries(lbRes.entries);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Personal Rank Banner */}
      <PersonalRankBanner rankSummary={personalRank} userName={userName} />

      {/* Main View Navigation Tabs */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60 dark:border-white/[0.06]">
        <div className="cosmic-tab-container">
          <button
            type="button"
            onClick={() => setActiveTab("rankings")}
            className={activeTab === "rankings" ? "cosmic-tab-active" : "cosmic-tab"}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Leaderboard</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("achievements")}
            className={activeTab === "achievements" ? "cosmic-tab-active" : "cosmic-tab"}
          >
            <Award className="w-4 h-4 text-sky-400" />
            <span>Milestones & Badges</span>
          </button>

          {isLeader && (
            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className={activeTab === "admin" ? "cosmic-tab-active" : "cosmic-tab"}
            >
              <Settings2 className="w-4 h-4 text-purple-400" />
              <span>Milestone Config</span>
            </button>
          )}
        </div>

        {isPending && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      {/* View Content */}
      {activeTab === "rankings" && (
        <LeaderboardTable
          entries={entries}
          currentUserId={currentUserId}
          category={category}
          period={period}
          onCategoryChange={handleCategoryChange}
          onPeriodChange={handlePeriodChange}
        />
      )}

      {activeTab === "achievements" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Team Milestones & Achievements
            </h3>
            <p className="text-xs text-muted-foreground">
              Milestones unlocked automatically through verified points, technical courses, and weekly contributions.
            </p>
          </div>
          <AchievementsGrid achievements={catalog} />
        </div>
      )}

      {activeTab === "admin" && isLeader && (
        <AchievementAdminSection
          achievements={catalog as Achievement[]}
          onRefresh={refreshCatalog}
        />
      )}
    </div>
  );
}
