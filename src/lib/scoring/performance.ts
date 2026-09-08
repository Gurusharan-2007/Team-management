/**
 * Performance Scoring and Deterministic Ranking Engine
 *
 * Implements explicit, documented formulas for ranking team members.
 * Overall Performance Formula:
 *   Score = (Activity Points * 1.0)
 *         + (Reward Points * 2.0)
 *         + (Completed Courses * 15.0)
 *         + (Completed Goals * 25.0)
 *         + (max(0, Weekly Improvement Delta) * 1.5)
 *
 * Fallback Behavior:
 *   When fewer than 2 weekly snapshots exist, the weekly improvement delta
 *   defaults to 0, evaluating scores purely on verified Activity Points,
 *   Reward Points, completed courses, and completed goals.
 *
 * Deterministic Tie-Breaking Rules:
 *   - Overall: Score (desc) -> Activity Pts (desc) -> Reward Pts (desc) -> Full Name (A-Z) -> ID
 *   - Activity: Activity Pts (desc) -> Reward Pts (desc) -> Full Name (A-Z) -> ID
 *   - Reward: Reward Pts (desc) -> Activity Pts (desc) -> Full Name (A-Z) -> ID
 */

import { LeaderboardCategory, LeaderboardEntry, UserRole, UserStatus } from '@/types/domain';

export interface ScoreComponents {
  activityPoints: number;
  rewardPoints: number;
  completedCoursesCount: number;
  completedGoalsCount: number;
  weeklyImprovementDelta?: number;
}

export const SCORING_WEIGHTS = {
  ACTIVITY_POINTS: 1.0,
  REWARD_POINTS: 2.0,
  COURSE_COMPLETION: 15.0,
  GOAL_COMPLETION: 25.0,
  WEEKLY_DELTA: 1.5,
} as const;

/**
 * Computes deterministic overall performance score for a team member.
 */
export function calculateOverallPerformanceScore(components: ScoreComponents): number {
  const actPts = Math.max(0, components.activityPoints || 0);
  const rewPts = Math.max(0, components.rewardPoints || 0);
  const courses = Math.max(0, components.completedCoursesCount || 0);
  const goals = Math.max(0, components.completedGoalsCount || 0);
  
  // Weekly delta only adds positive momentum; negative delta doesn't penalize overall foundation
  const weeklyDelta = Math.max(0, components.weeklyImprovementDelta ?? 0);

  const rawScore =
    actPts * SCORING_WEIGHTS.ACTIVITY_POINTS +
    rewPts * SCORING_WEIGHTS.REWARD_POINTS +
    courses * SCORING_WEIGHTS.COURSE_COMPLETION +
    goals * SCORING_WEIGHTS.GOAL_COMPLETION +
    weeklyDelta * SCORING_WEIGHTS.WEEKLY_DELTA;

  // Return rounded to 1 decimal place to avoid floating point imprecision
  return Math.round(rawScore * 10) / 10;
}

export interface UnrankedMember {
  member_id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  status: UserStatus;
  activity_points: number;
  reward_points: number;
  completed_courses_count: number;
  completed_goals_count: number;
  weekly_improvement_delta: number;
  earned_achievements_count: number;
}

/**
 * Sorts and assigns deterministic ranks (1 to N) to active team members.
 * Applies secondary tie-breakers so rankings are guaranteed stable across page reloads.
 */
export function rankMembers(
  members: UnrankedMember[],
  category: LeaderboardCategory
): LeaderboardEntry[] {
  // Exclude inactive members from rankings
  const activeMembers = members.filter((m) => m.status === 'active');

  // Compute overall scores for all entries
  const entriesWithScores = activeMembers.map((m) => {
    const overall_score = calculateOverallPerformanceScore({
      activityPoints: m.activity_points,
      rewardPoints: m.reward_points,
      completedCoursesCount: m.completed_courses_count,
      completedGoalsCount: m.completed_goals_count,
      weeklyImprovementDelta: m.weekly_improvement_delta,
    });

    return {
      ...m,
      overall_score,
    };
  });

  // Sort deterministically based on chosen category
  entriesWithScores.sort((a, b) => {
    if (category === 'overall') {
      if (b.overall_score !== a.overall_score) {
        return b.overall_score - a.overall_score;
      }
      if (b.activity_points !== a.activity_points) {
        return b.activity_points - a.activity_points;
      }
      if (b.reward_points !== a.reward_points) {
        return b.reward_points - a.reward_points;
      }
    } else if (category === 'activity') {
      if (b.activity_points !== a.activity_points) {
        return b.activity_points - a.activity_points;
      }
      if (b.reward_points !== a.reward_points) {
        return b.reward_points - a.reward_points;
      }
      if (b.overall_score !== a.overall_score) {
        return b.overall_score - a.overall_score;
      }
    } else if (category === 'reward') {
      if (b.reward_points !== a.reward_points) {
        return b.reward_points - a.reward_points;
      }
      if (b.activity_points !== a.activity_points) {
        return b.activity_points - a.activity_points;
      }
      if (b.overall_score !== a.overall_score) {
        return b.overall_score - a.overall_score;
      }
    }

    // Secondary tie-breaker: Name alphabetical ascending
    const nameDiff = a.full_name.localeCompare(b.full_name);
    if (nameDiff !== 0) return nameDiff;

    // Tertiary tie-breaker: ID lexicographical ascending
    return a.member_id.localeCompare(b.member_id);
  });

  // Assign 1-indexed ranks
  return entriesWithScores.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

/**
 * Retrieves the rank summary for a specific member from a ranked list.
 */
export function findMemberRank(
  rankedEntries: LeaderboardEntry[],
  memberId: string
): { rank: number | null; total: number } {
  const index = rankedEntries.findIndex((e) => e.member_id === memberId);
  return {
    rank: index >= 0 ? rankedEntries[index].rank : null,
    total: rankedEntries.length,
  };
}
