-- ==============================================================================
-- Migration: 00005_goals_and_dashboard_analytics.sql
-- Description: Extensible goals/targets system (team and individual targets),
--              audit actions for goals, and role-based RLS policies.
-- ==============================================================================

-- 1. ENHANCE GOALS TABLE
DO $$
BEGIN
    -- Add scope column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'goals' AND column_name = 'scope'
    ) THEN
        ALTER TABLE public.goals
            ADD COLUMN scope VARCHAR(20) NOT NULL DEFAULT 'team'
            CHECK (scope IN ('team', 'individual'));
    END IF;

    -- Add target_member_id column for individual targets
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'goals' AND column_name = 'target_member_id'
    ) THEN
        ALTER TABLE public.goals
            ADD COLUMN target_member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Add created_by column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'goals' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.goals
            ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Update status constraint on goals to support ('active', 'completed', 'archived')
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_status_check;
ALTER TABLE public.goals
    ADD CONSTRAINT goals_status_check
    CHECK (status IN ('active', 'completed', 'archived', 'in_progress', 'cancelled'));

-- Add target_points positive check
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS chk_goals_target_points_positive;
ALTER TABLE public.goals
    ADD CONSTRAINT chk_goals_target_points_positive
    CHECK (target_points > 0);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_goals_scope_status ON public.goals(scope, status);
CREATE INDEX IF NOT EXISTS idx_goals_target_member ON public.goals(target_member_id);

-- 2. UPDATE AUDIT LOGS ACTION CHECK
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
        'goal_deactivated'
    ));

-- 3. RLS POLICIES FOR GOALS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "goals_select_policy" ON public.goals;
CREATE POLICY "goals_select_policy"
    ON public.goals
    FOR SELECT
    USING (
        -- Leadership (Captain, Vice Captain, Manager, Strategist) can view all goals
        public.get_auth_user_role() IN ('captain', 'vice_captain', 'manager', 'strategist')
        -- Members can view team goals and their own individual goals
        OR scope = 'team'
        OR target_member_id = auth.uid()
    );

-- Only Captain and Vice Captain may insert, update, or delete goals
DROP POLICY IF EXISTS "goals_insert_policy" ON public.goals;
CREATE POLICY "goals_insert_policy"
    ON public.goals
    FOR INSERT
    WITH CHECK (
        public.get_auth_user_role() IN ('captain', 'vice_captain')
    );

DROP POLICY IF EXISTS "goals_update_policy" ON public.goals;
CREATE POLICY "goals_update_policy"
    ON public.goals
    FOR UPDATE
    USING (
        public.get_auth_user_role() IN ('captain', 'vice_captain')
    );

DROP POLICY IF EXISTS "goals_delete_policy" ON public.goals;
CREATE POLICY "goals_delete_policy"
    ON public.goals
    FOR DELETE
    USING (
        public.get_auth_user_role() IN ('captain', 'vice_captain')
    );

-- 4. SEED FOUNDATIONAL GOALS IF NONE EXIST
INSERT INTO public.goals (title, description, target_points, point_type, scope, status)
SELECT 'Quarterly Sprint Target', 'Team-wide sprint goal for technical task contributions and code reviews', 500, 'activity', 'team', 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.goals WHERE title = 'Quarterly Sprint Target');

INSERT INTO public.goals (title, description, target_points, point_type, scope, status)
SELECT 'Leadership Honors Milestone', 'Team recognition milestone for mentorship, documentation, and campus workshop hosting', 150, 'reward', 'team', 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.goals WHERE title = 'Leadership Honors Milestone');
