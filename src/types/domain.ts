import {
  Database,
  UserRole,
  UserStatus,
  PointType,
  ReportStatus,
  WeeklyReportStatus,
  WeeklyReminderType,
  CronJobStatus,
  GoalStatus,
  GoalScope,
  NotificationType,
  AuditAction,
  CourseStatus,
  PointAdjustmentSource,
  AchievementType,
  MemberAchievement,
  TeamSettings,
} from './database';

export type {
  UserRole,
  UserStatus,
  PointType,
  ReportStatus,
  WeeklyReportStatus,
  WeeklyReminderType,
  CronJobStatus,
  GoalStatus,
  GoalScope,
  NotificationType,
  AuditAction,
  CourseStatus,
  PointAdjustmentSource,
  AchievementType,
  MemberAchievement,
  TeamSettings,
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Course = Database['public']['Tables']['courses']['Row'];
export type MemberCourse = Database['public']['Tables']['member_courses']['Row'];
export type WeeklyReport = Database['public']['Tables']['weekly_reports']['Row'];
export type MemberWeeklyReport = Database['public']['Tables']['member_weekly_reports']['Row'];
export type TeamWeeklyReport = Database['public']['Tables']['team_weekly_reports']['Row'];
export type WeeklyMemberUpdate = Database['public']['Tables']['weekly_member_updates']['Row'];
export type WeeklyReminder = Database['public']['Tables']['weekly_reminders']['Row'];
export type CronJobLog = Database['public']['Tables']['cron_job_logs']['Row'];
export type PointHistoryItem = Database['public']['Tables']['point_history']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Goal = Database['public']['Tables']['goals']['Row'];
export type Achievement = Database['public']['Tables']['achievements']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

export interface PointHistoryItemWithActor extends PointHistoryItem {
  actor?: {
    full_name: string;
    role: UserRole;
    email: string;
  } | null;
}

export interface GoalWithProgress extends Goal {
  current_points: number;
  progress_percentage: number;
  is_completed: boolean;
  target_member?: {
    full_name: string;
    email: string;
    role: UserRole;
  } | null;
}

export interface CourseWithCompletion extends Course {
  is_completed: boolean;
}

export interface MemberListItem extends Profile {
  completed_courses_count: number;
}

export interface MemberWeeklyReportWithProfile extends MemberWeeklyReport {
  member?: {
    full_name: string;
    email: string;
    role: UserRole;
    avatar_url: string | null;
  } | null;
  previous_activity_points?: number | null;
  previous_reward_points?: number | null;
  activity_change?: number | null;
  reward_change?: number | null;
}

export interface WeeklyReportWithDetails extends WeeklyReport {
  team_report?: TeamWeeklyReport | null;
  member_reports?: MemberWeeklyReportWithProfile[];
  activity_points_growth_percentage?: number | null;
  reward_points_growth_percentage?: number | null;
  members_updated_percentage?: number | null;
}

export interface WeeklyTrendPoint {
  week_start: string;
  week_end: string;
  week_label: string;
  activity_points: number;
  reward_points: number;
}

export interface UserSession {
  id: string;
  email: string;
  profile: Profile | null;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  captain: 'Captain',
  vice_captain: 'Vice Captain',
  manager: 'Manager',
  strategist: 'Strategist',
  member: 'Member',
};

export const ROLE_BADGE_VARIANTS: Record<
  UserRole,
  'default' | 'secondary' | 'outline' | 'subtle'
> = {
  captain: 'default',
  vice_captain: 'secondary',
  manager: 'outline',
  strategist: 'outline',
  member: 'subtle',
};

export const STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
};

export const ALL_ROLES: UserRole[] = [
  'captain',
  'vice_captain',
  'manager',
  'strategist',
  'member',
];

export type LeaderboardCategory = 'overall' | 'activity' | 'reward';
export type LeaderboardPeriod = 'all_time' | 'current_week' | 'previous_week';

export interface LeaderboardEntry {
  member_id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  status: UserStatus;
  rank: number;
  activity_points: number;
  reward_points: number;
  completed_courses_count: number;
  completed_goals_count: number;
  weekly_improvement_delta: number;
  overall_score: number;
  earned_achievements_count: number;
  earned_achievements?: Achievement[];
}

export interface AchievementWithStatus extends Achievement {
  is_earned: boolean;
  awarded_at?: string | null;
  current_value: number;
  progress_percentage: number;
  metadata?: Record<string, unknown>;
}

export interface PersonalRankSummary {
  overall_rank: number | null;
  activity_rank: number | null;
  reward_rank: number | null;
  total_active_members: number;
  overall_score: number;
  activity_points: number;
  reward_points: number;
}

export type TimelineFilterCategory =
  | 'all'
  | 'points'
  | 'courses'
  | 'goals'
  | 'achievements'
  | 'members'
  | 'reports'
  | 'settings';

export interface AuditLogWithActor extends AuditLog {
  actor?: {
    full_name: string;
    role: UserRole;
    email: string;
  } | null;
  target_profile?: {
    full_name: string;
    role: UserRole;
    email: string;
  } | null;
}

export interface TeamExportRecord {
  member_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  activity_points: number;
  reward_points: number;
  completed_courses_count: number;
  completed_goals_count: number;
  overall_score: number;
  created_at: string;
}

