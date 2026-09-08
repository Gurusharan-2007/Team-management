-- ============================================================================
-- MIGRATION 00007: LEADERBOARD, ACHIEVEMENTS & MILESTONES
-- ============================================================================

-- 1. ACHIEVEMENTS TABLE
-- Stores milestone and achievement definitions configurable by Captain and Vice Captain
DROP TABLE IF EXISTS public.member_achievements CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;

CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'award',
    achievement_type TEXT NOT NULL CHECK (
        achievement_type IN (
            'activity_points',
            'reward_points',
            'courses_completed',
            'weekly_updates',
            'goal_completed',
            'improvement'
        )
    ),
    threshold INTEGER NOT NULL DEFAULT 1 CHECK (threshold >= 0),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_achievements_type_active ON public.achievements(achievement_type, active);

-- 2. MEMBER ACHIEVEMENTS TABLE
-- Records verified milestone awards earned by members.
-- Enforces uniqueness per (member_id, achievement_id) to strictly prevent duplicate awards.
CREATE TABLE IF NOT EXISTS public.member_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT uq_member_achievement UNIQUE (member_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_member_achievements_member ON public.member_achievements(member_id);
CREATE INDEX IF NOT EXISTS idx_member_achievements_achievement ON public.member_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_member_achievements_awarded_at ON public.member_achievements(awarded_at DESC);

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
        'achievement_awarded'
    ));

-- 4. ROW LEVEL SECURITY
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements RLS Policies
DROP POLICY IF EXISTS "Authenticated users can view achievements" ON public.achievements;
CREATE POLICY "Authenticated users can view achievements"
    ON public.achievements FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Leadership can insert achievements" ON public.achievements;
CREATE POLICY "Leadership can insert achievements"
    ON public.achievements FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
            AND public.profiles.role IN ('captain', 'vice_captain')
            AND public.profiles.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Leadership can update achievements" ON public.achievements;
CREATE POLICY "Leadership can update achievements"
    ON public.achievements FOR UPDATE
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

-- Member Achievements RLS Policies
DROP POLICY IF EXISTS "Authenticated users can view member achievements" ON public.member_achievements;
CREATE POLICY "Authenticated users can view member achievements"
    ON public.member_achievements FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Leadership can award member achievements" ON public.member_achievements;
CREATE POLICY "Leadership can award member achievements"
    ON public.member_achievements FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
            AND public.profiles.role IN ('captain', 'vice_captain')
            AND public.profiles.status = 'active'
        )
    );

-- 5. SEED 11 CORE ACHIEVEMENTS
INSERT INTO public.achievements (name, description, icon, achievement_type, threshold, active) VALUES
    ('50 Activity Points', 'Earned a total of 50 or more Activity Points.', 'zap', 'activity_points', 50, true),
    ('100 Activity Points', 'Earned a total of 100 or more Activity Points.', 'zap', 'activity_points', 100, true),
    ('250 Activity Points', 'Earned a total of 250 or more Activity Points.', 'zap', 'activity_points', 250, true),
    ('500 Activity Points', 'Reached the elite milestone of 500 Activity Points.', 'trophy', 'activity_points', 500, true),
    ('50 Reward Points', 'Accumulated 50 or more Reward Points.', 'gift', 'reward_points', 50, true),
    ('100 Reward Points', 'Accumulated 100 or more Reward Points.', 'gift', 'reward_points', 100, true),
    ('First Course', 'Successfully completed your first technical course.', 'book-open', 'courses_completed', 1, true),
    ('Course Scholar', 'Completed 3 or more technical courses.', 'graduation-cap', 'courses_completed', 3, true),
    ('Goal Achiever', 'Successfully completed your first assigned or team goal.', 'target', 'goal_completed', 1, true),
    ('Consistent Contributor', 'Submitted 4 weekly Saturday updates demonstrating steady dedication.', 'calendar-check', 'weekly_updates', 4, true),
    ('Rising Momentum', 'Achieved a weekly improvement delta of 25+ points compared to the prior week.', 'trending-up', 'improvement', 25, true)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    achievement_type = EXCLUDED.achievement_type,
    threshold = EXCLUDED.threshold,
    active = EXCLUDED.active,
    updated_at = TIMEZONE('utc', NOW());
