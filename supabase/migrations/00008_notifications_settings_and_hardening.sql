-- ============================================================================
-- MIGRATION 00008: NOTIFICATIONS, SETTINGS, AUDIT & SECURITY HARDENING
-- ============================================================================

-- 1. NOTIFICATIONS ACTION URL
-- Add optional action URL for contextual one-click navigation
ALTER TABLE public.notifications
    ADD COLUMN IF NOT EXISTS action_url TEXT;

-- 2. TEAM SETTINGS TABLE
-- Stores workspace-wide configuration, centralized timezone, and automation toggles
CREATE TABLE IF NOT EXISTS public.team_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name TEXT NOT NULL DEFAULT 'Core Engineering Team',
    team_description TEXT DEFAULT 'College Engineering & Technical Development Team',
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    saturday_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
    auto_reports_enabled BOOLEAN NOT NULL DEFAULT true,
    reporting_schedule JSONB DEFAULT '{"week_start":"Sunday","week_end":"Saturday","reminder_times":["11:00","16:00","18:00"],"report_time":"20:00"}'::jsonb,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Seed default initial row
INSERT INTO public.team_settings (team_name, team_description, timezone, saturday_reminders_enabled, auto_reports_enabled)
SELECT 'Core Engineering Team', 'College Engineering & Technical Development Team', 'Asia/Kolkata', true, true
WHERE NOT EXISTS (SELECT 1 FROM public.team_settings);

-- 3. UPDATE AUDIT LOGS ACTION CHECK
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_action_check;
ALTER TABLE public.audit_logs
    ADD CONSTRAINT audit_logs_action_check
    CHECK (action IN (
        'role_changed',
        'member_deactivated',
        'member_activated',
        'member_updated',
        'member_created',
        'points_adjusted',
        'course_created',
        'course_updated',
        'course_deactivated',
        'course_completed',
        'course_uncompleted',
        'goal_created',
        'goal_updated',
        'goal_deactivated',
        'weekly_report_generated',
        'saturday_update_submitted',
        'achievement_created',
        'achievement_updated',
        'achievement_deactivated',
        'achievement_awarded',
        'settings_updated',
        'invitation_created',
        'invitation_revoked',
        'member_exported'
    ));

-- 4. DATABASE-LEVEL LAST CAPTAIN PROTECTION
CREATE OR REPLACE FUNCTION public.check_last_captain_protection()
RETURNS TRIGGER AS $$
BEGIN
    -- If demoting an active captain or deactivating an active captain
    IF (OLD.role = 'captain' AND NEW.role <> 'captain') OR
       (OLD.role = 'captain' AND OLD.status = 'active' AND NEW.status <> 'active') THEN
        IF (SELECT count(*) FROM public.profiles WHERE role = 'captain' AND status = 'active' AND id <> OLD.id) < 1 THEN
            RAISE EXCEPTION 'Operation rejected: Cannot demote or deactivate the last active Captain in the organization.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_last_captain ON public.profiles;
CREATE TRIGGER trg_protect_last_captain
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.check_last_captain_protection();

-- 5. ROW LEVEL SECURITY POLICIES

-- Enable RLS on team_settings
ALTER TABLE public.team_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view team settings" ON public.team_settings;
CREATE POLICY "Authenticated users can view team settings"
    ON public.team_settings FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Leadership can update team settings" ON public.team_settings;
CREATE POLICY "Leadership can update team settings"
    ON public.team_settings FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
            AND public.profiles.role IN ('captain', 'vice_captain')
            AND public.profiles.status = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
            AND public.profiles.role IN ('captain', 'vice_captain')
            AND public.profiles.status = 'active'
        )
    );

-- Strengthen notifications RLS: users can only manage their own notifications
DROP POLICY IF EXISTS "Users can view and manage own notifications" ON public.notifications;
CREATE POLICY "Users can view and manage own notifications"
    ON public.notifications FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Leadership audit log read access
DROP POLICY IF EXISTS "Leadership can view all audit logs" ON public.audit_logs;
CREATE POLICY "Leadership can view all audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
            AND public.profiles.role IN ('captain', 'vice_captain', 'manager', 'strategist')
            AND public.profiles.status = 'active'
        )
    );
