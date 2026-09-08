export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | 'captain'
  | 'vice_captain'
  | 'manager'
  | 'strategist'
  | 'member';

export type UserStatus = 'active' | 'inactive';

export type PointType = 'activity' | 'reward';

export type PointAdjustmentSource = 'admin_adjustment' | 'self_update';

export type ReportStatus = 'draft' | 'submitted' | 'reviewed' | 'published';

export type WeeklyReportStatus = 'open' | 'generated';

export type WeeklyReminderType = 'saturday_11am' | 'saturday_4pm' | 'saturday_6pm';

export type CronJobStatus = 'running' | 'success' | 'failed';

export type GoalScope = 'team' | 'individual';

export type GoalStatus = 'active' | 'completed' | 'archived' | 'in_progress' | 'cancelled';

export type NotificationType =
  | 'system'
  | 'reminder'
  | 'achievement'
  | 'report'
  | 'point_change';

export type CourseStatus = 'active' | 'archived';

export type AchievementType =
  | 'activity_points'
  | 'reward_points'
  | 'courses_completed'
  | 'weekly_updates'
  | 'goal_completed'
  | 'improvement';

export type AuditAction =
  | 'role_changed'
  | 'member_deactivated'
  | 'member_activated'
  | 'member_updated'
  | 'member_created'
  | 'points_adjusted'
  | 'course_created'
  | 'course_updated'
  | 'course_deactivated'
  | 'course_completed'
  | 'course_uncompleted'
  | 'goal_created'
  | 'goal_updated'
  | 'goal_deactivated'
  | 'weekly_report_generated'
  | 'saturday_update_submitted'
  | 'achievement_created'
  | 'achievement_updated'
  | 'achievement_deactivated'
  | 'achievement_awarded'
  | 'achievement_unlocked'
  | 'settings_updated'
  | 'invitation_created'
  | 'invitation_revoked'
  | 'member_exported';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: UserRole;
          status: UserStatus;
          activity_points: number;
          reward_points: number;
          avatar_url: string | null;
          bio?: string | null;
          github_username?: string | null;
          linkedin_url?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role?: UserRole;
          status?: UserStatus;
          activity_points?: number;
          reward_points?: number;
          avatar_url?: string | null;
          bio?: string | null;
          github_username?: string | null;
          linkedin_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: UserRole;
          status?: UserStatus;
          activity_points?: number;
          reward_points?: number;
          avatar_url?: string | null;
          bio?: string | null;
          github_username?: string | null;
          linkedin_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          performed_by: string | null;
          affected_user_id: string | null;
          action: AuditAction;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          performed_by?: string | null;
          affected_user_id?: string | null;
          action: AuditAction;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          performed_by?: string | null;
          affected_user_id?: string | null;
          action?: AuditAction;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: CourseStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          status?: CourseStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          status?: CourseStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      member_courses: {
        Row: {
          id: string;
          member_id: string;
          course_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          course_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          course_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      weekly_reports: {
        Row: {
          id: string;
          week_start: string;
          week_end: string;
          status: WeeklyReportStatus;
          generated_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          week_start: string;
          week_end: string;
          status?: WeeklyReportStatus;
          generated_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          week_start?: string;
          week_end?: string;
          status?: WeeklyReportStatus;
          generated_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      member_weekly_reports: {
        Row: {
          id: string;
          weekly_report_id: string;
          member_id: string;
          activity_points: number;
          reward_points: number;
          courses_completed: number;
          updated_on_saturday: boolean;
          last_update_at: string | null;
          generated_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          weekly_report_id: string;
          member_id: string;
          activity_points?: number;
          reward_points?: number;
          courses_completed?: number;
          updated_on_saturday?: boolean;
          last_update_at?: string | null;
          generated_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          weekly_report_id?: string;
          member_id?: string;
          activity_points?: number;
          reward_points?: number;
          courses_completed?: number;
          updated_on_saturday?: boolean;
          last_update_at?: string | null;
          generated_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      team_weekly_reports: {
        Row: {
          id: string;
          weekly_report_id: string;
          total_activity_points: number;
          total_reward_points: number;
          total_courses_completed: number;
          active_member_count: number;
          updated_member_count: number;
          generated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          weekly_report_id: string;
          total_activity_points?: number;
          total_reward_points?: number;
          total_courses_completed?: number;
          active_member_count?: number;
          updated_member_count?: number;
          generated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          weekly_report_id?: string;
          total_activity_points?: number;
          total_reward_points?: number;
          total_courses_completed?: number;
          active_member_count?: number;
          updated_member_count?: number;
          generated_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      weekly_member_updates: {
        Row: {
          id: string;
          weekly_report_id: string;
          member_id: string;
          activity_points: number;
          reward_points: number;
          submitted_at: string;
          is_late: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          weekly_report_id: string;
          member_id: string;
          activity_points: number;
          reward_points: number;
          submitted_at?: string;
          is_late?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          weekly_report_id?: string;
          member_id?: string;
          activity_points?: number;
          reward_points?: number;
          submitted_at?: string;
          is_late?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      weekly_reminders: {
        Row: {
          id: string;
          weekly_report_id: string;
          member_id: string;
          reminder_type: WeeklyReminderType;
          sent_at: string;
          status: string;
        };
        Insert: {
          id?: string;
          weekly_report_id: string;
          member_id: string;
          reminder_type: WeeklyReminderType;
          sent_at?: string;
          status?: string;
        };
        Update: {
          id?: string;
          weekly_report_id?: string;
          member_id?: string;
          reminder_type?: WeeklyReminderType;
          sent_at?: string;
          status?: string;
        };
        Relationships: [];
      };
      cron_job_logs: {
        Row: {
          id: string;
          job_name: string;
          status: CronJobStatus;
          members_processed: number | null;
          notifications_sent: number | null;
          report_generated: boolean | null;
          details: Json | null;
          error_message: string | null;
          executed_at: string;
        };
        Insert: {
          id?: string;
          job_name: string;
          status: CronJobStatus;
          members_processed?: number | null;
          notifications_sent?: number | null;
          report_generated?: boolean | null;
          details?: Json | null;
          error_message?: string | null;
          executed_at?: string;
        };
        Update: {
          id?: string;
          job_name?: string;
          status?: CronJobStatus;
          members_processed?: number | null;
          notifications_sent?: number | null;
          report_generated?: boolean | null;
          details?: Json | null;
          error_message?: string | null;
          executed_at?: string;
        };
        Relationships: [];
      };
      point_history: {
        Row: {
          id: string;
          member_id: string;
          point_type: PointType;
          previous_value: number;
          new_value: number;
          change_amount: number;
          reason: string;
          changed_by: string | null;
          source: PointAdjustmentSource;
          actor_role: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          point_type: PointType;
          previous_value: number;
          new_value: number;
          change_amount: number;
          reason: string;
          changed_by?: string | null;
          source?: PointAdjustmentSource;
          actor_role?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          point_type?: PointType;
          previous_value?: number;
          new_value?: number;
          change_amount?: number;
          reason?: string;
          changed_by?: string | null;
          source?: PointAdjustmentSource;
          actor_role?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: NotificationType;
          is_read: boolean;
          action_url?: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: NotificationType;
          is_read?: boolean;
          action_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: NotificationType;
          is_read?: boolean;
          action_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          target_points: number;
          point_type: PointType;
          scope: GoalScope;
          target_member_id: string | null;
          created_by: string | null;
          target_date: string | null;
          status: GoalStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          target_points: number;
          point_type: PointType;
          scope?: GoalScope;
          target_member_id?: string | null;
          created_by?: string | null;
          target_date?: string | null;
          status?: GoalStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          target_points?: number;
          point_type?: PointType;
          scope?: GoalScope;
          target_member_id?: string | null;
          created_by?: string | null;
          target_date?: string | null;
          status?: GoalStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      achievements: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string;
          achievement_type: AchievementType;
          threshold: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          icon?: string;
          achievement_type: AchievementType;
          threshold?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon?: string;
          achievement_type?: AchievementType;
          threshold?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      member_achievements: {
        Row: {
          id: string;
          member_id: string;
          achievement_id: string;
          awarded_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          member_id: string;
          achievement_id: string;
          awarded_at?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          member_id?: string;
          achievement_id?: string;
          awarded_at?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "member_achievements_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_achievements_achievement_id_fkey";
            columns: ["achievement_id"];
            isOneToOne: false;
            referencedRelation: "achievements";
            referencedColumns: ["id"];
          }
        ];
      };
      team_settings: {
        Row: {
          id: string;
          team_name: string;
          team_description: string | null;
          timezone: string;
          saturday_reminders_enabled: boolean;
          auto_reports_enabled: boolean;
          reporting_schedule: Json;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_name?: string;
          team_description?: string | null;
          timezone?: string;
          saturday_reminders_enabled?: boolean;
          auto_reports_enabled?: boolean;
          reporting_schedule?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_name?: string;
          team_description?: string | null;
          timezone?: string;
          saturday_reminders_enabled?: boolean;
          auto_reports_enabled?: boolean;
          reporting_schedule?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_auth_user_role: {
        Args: Record<string, never>;
        Returns: string;
      };
      bootstrap_initial_captain: {
        Args: {
          target_email: string;
        };
        Returns: boolean;
      };
      adjust_member_points: {
        Args: {
          p_target_member_id: string;
          p_point_type: PointType;
          p_change_amount: number;
          p_reason: string;
          p_source?: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      point_type: PointType;
      report_status: ReportStatus;
      weekly_report_status: WeeklyReportStatus;
      weekly_reminder_type: WeeklyReminderType;
      cron_job_status: CronJobStatus;
      goal_status: GoalStatus;
      notification_type: NotificationType;
      audit_action: AuditAction;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

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
export type MemberAchievement = Database['public']['Tables']['member_achievements']['Row'];
export type TeamSettings = Database['public']['Tables']['team_settings']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
