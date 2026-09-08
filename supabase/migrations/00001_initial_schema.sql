-- ==============================================================================
-- College Team Management System - Initial Database Schema Migration
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CUSTOM TYPES & ENUMS (using CHECK constraints for maximum compatibility)
-- Roles: captain, vice_captain, manager, strategist, member
-- Point types: activity, reward
-- Report statuses: draft, submitted, reviewed, published
-- Goal statuses: in_progress, completed, cancelled
-- Notification types: system, reminder, achievement, report, point_change

-- 3. PROFILES TABLE
-- Extends auth.users. Default role is strictly 'member'.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('captain', 'vice_captain', 'manager', 'strategist', 'member')) DEFAULT 'member',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 4. COURSES TABLE
-- Technical courses catalog
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 5. MEMBER_COURSES TABLE
-- Relationship between members and completed courses (No completion date per requirements)
CREATE TABLE IF NOT EXISTS public.member_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_member_course UNIQUE (member_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_member_courses_member ON public.member_courses(member_id);
CREATE INDEX IF NOT EXISTS idx_member_courses_course ON public.member_courses(course_id);

-- 6. WEEKLY_REPORTS TABLE
-- Dedicated weekly snapshots for reliable historical trend analysis
-- Current point totals and weekly snapshots are strictly separated.
CREATE TABLE IF NOT EXISTS public.weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_identifier TEXT NOT NULL, -- e.g., '2026-W36'
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_points_snapshot INTEGER NOT NULL DEFAULT 0,
    reward_points_snapshot INTEGER NOT NULL DEFAULT 0,
    update_status TEXT NOT NULL CHECK (update_status IN ('draft', 'submitted', 'reviewed', 'published')) DEFAULT 'draft',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_week_member UNIQUE (week_identifier, member_id)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_week ON public.weekly_reports(week_identifier);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_member ON public.weekly_reports(member_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_generated ON public.weekly_reports(generated_at);

-- 7. POINT_HISTORY TABLE
-- Immutable audit log of all point adjustments
CREATE TABLE IF NOT EXISTS public.point_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    point_type TEXT NOT NULL CHECK (point_type IN ('activity', 'reward')),
    previous_value INTEGER NOT NULL,
    new_value INTEGER NOT NULL,
    change_amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_point_history_member ON public.point_history(member_id);
CREATE INDEX IF NOT EXISTS idx_point_history_type ON public.point_history(point_type);
CREATE INDEX IF NOT EXISTS idx_point_history_created ON public.point_history(created_at);

-- 8. NOTIFICATIONS TABLE
-- System and event notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('system', 'reminder', 'achievement', 'report', 'point_change')) DEFAULT 'system',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE is_read = FALSE;

-- 9. GOALS TABLE
-- Future activity and reward point targets
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    target_points INTEGER NOT NULL,
    point_type TEXT NOT NULL CHECK (point_type IN ('activity', 'reward')),
    target_date DATE,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'cancelled')) DEFAULT 'in_progress',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);

-- 10. ACHIEVEMENTS TABLE
-- Gamification achievements and badges
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    badge_url TEXT,
    criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- ==============================================================================
-- HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Function to get current user's role safely
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trigger_weekly_reports_updated_at
    BEFORE UPDATE ON public.weekly_reports
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trigger_goals_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger to create profile when auth.users is created
-- Ensures full_name is populated from raw_user_meta_data and default role is 'member'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'member',
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
-- Authenticated users can view team profiles
CREATE POLICY "Authenticated users can view profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Users can update their own non-privileged details (full_name, avatar_url)
CREATE POLICY "Users can update own profile details"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Captains and Vice Captains have elevated update permissions
CREATE POLICY "Captains and Vice Captains can manage all profiles"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (public.get_auth_user_role() IN ('captain', 'vice_captain'));

-- 2. COURSES POLICIES
CREATE POLICY "Authenticated users can view courses"
    ON public.courses FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Leadership can manage courses"
    ON public.courses FOR ALL
    TO authenticated
    USING (public.get_auth_user_role() IN ('captain', 'vice_captain', 'manager'));

-- 3. MEMBER COURSES POLICIES
CREATE POLICY "Authenticated users can view member courses"
    ON public.member_courses FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage own member courses"
    ON public.member_courses FOR ALL
    TO authenticated
    USING (auth.uid() = member_id OR public.get_auth_user_role() IN ('captain', 'vice_captain'));

-- 4. WEEKLY REPORTS POLICIES
-- Members can view their own reports; Leadership can view all reports
CREATE POLICY "Users can view relevant weekly reports"
    ON public.weekly_reports FOR SELECT
    TO authenticated
    USING (
        auth.uid() = member_id OR 
        public.get_auth_user_role() IN ('captain', 'vice_captain', 'manager', 'strategist')
    );

CREATE POLICY "Leadership can manage weekly reports"
    ON public.weekly_reports FOR ALL
    TO authenticated
    USING (public.get_auth_user_role() IN ('captain', 'vice_captain'));

-- 5. POINT HISTORY POLICIES
-- Members can view their own point changes; Leadership can view all
CREATE POLICY "Users can view relevant point history"
    ON public.point_history FOR SELECT
    TO authenticated
    USING (
        auth.uid() = member_id OR 
        public.get_auth_user_role() IN ('captain', 'vice_captain', 'manager', 'strategist')
    );

CREATE POLICY "Captains and Vice Captains can insert point history"
    ON public.point_history FOR INSERT
    TO authenticated
    WITH CHECK (public.get_auth_user_role() IN ('captain', 'vice_captain'));

-- 6. NOTIFICATIONS POLICIES
CREATE POLICY "Users can view and manage own notifications"
    ON public.notifications FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 7. GOALS POLICIES
CREATE POLICY "Authenticated users can view goals"
    ON public.goals FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Leadership can manage goals"
    ON public.goals FOR ALL
    TO authenticated
    USING (public.get_auth_user_role() IN ('captain', 'vice_captain', 'manager'));

-- 8. ACHIEVEMENTS POLICIES
CREATE POLICY "Authenticated users can view achievements"
    ON public.achievements FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Leadership can manage achievements"
    ON public.achievements FOR ALL
    TO authenticated
    USING (public.get_auth_user_role() IN ('captain', 'vice_captain'));
