-- Migration: 00006_weekly_snapshots_and_reports.sql
-- Description: Creates the complete weekly reporting architecture, snapshot storage, Saturday update tracking, reminder deduplication, and cron observability.

-- 1. DROP OLD PLACEHOLDER IF EXISTS
DROP TABLE IF EXISTS public.weekly_reports CASCADE;

-- 2. WEEKLY REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('open', 'generated')) DEFAULT 'open',
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_weekly_reports_dates UNIQUE (week_start, week_end)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_dates ON public.weekly_reports(week_start DESC, week_end DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_status ON public.weekly_reports(status);

-- 3. MEMBER WEEKLY REPORTS (IMMUTABLE SNAPSHOTS)
CREATE TABLE IF NOT EXISTS public.member_weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekly_report_id UUID NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_points INTEGER NOT NULL DEFAULT 0,
    reward_points INTEGER NOT NULL DEFAULT 0,
    courses_completed INTEGER NOT NULL DEFAULT 0,
    updated_on_saturday BOOLEAN NOT NULL DEFAULT false,
    last_update_at TIMESTAMPTZ,
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_member_weekly_reports UNIQUE (weekly_report_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_member_weekly_reports_lookup ON public.member_weekly_reports(weekly_report_id, member_id);
CREATE INDEX IF NOT EXISTS idx_member_weekly_reports_member ON public.member_weekly_reports(member_id, created_at DESC);

-- 4. TEAM WEEKLY REPORTS (IMMUTABLE TEAM SNAPSHOTS)
CREATE TABLE IF NOT EXISTS public.team_weekly_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekly_report_id UUID NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
    total_activity_points INTEGER NOT NULL DEFAULT 0,
    total_reward_points INTEGER NOT NULL DEFAULT 0,
    total_courses_completed INTEGER NOT NULL DEFAULT 0,
    active_member_count INTEGER NOT NULL DEFAULT 0,
    updated_member_count INTEGER NOT NULL DEFAULT 0,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_team_weekly_reports UNIQUE (weekly_report_id)
);

CREATE INDEX IF NOT EXISTS idx_team_weekly_reports_report ON public.team_weekly_reports(weekly_report_id);

-- 5. WEEKLY MEMBER UPDATES (SATURDAY EXPLICIT UPDATE TRACKING)
CREATE TABLE IF NOT EXISTS public.weekly_member_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekly_report_id UUID NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_points INTEGER NOT NULL,
    reward_points INTEGER NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    is_late BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_weekly_member_updates UNIQUE (weekly_report_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_weekly_member_updates_lookup ON public.weekly_member_updates(weekly_report_id, member_id);

-- 6. WEEKLY REMINDERS (DEDUPLICATION AND IDEMPOTENT DELIVERY)
CREATE TABLE IF NOT EXISTS public.weekly_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekly_report_id UUID NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('saturday_11am', 'saturday_4pm', 'saturday_6pm')),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    status TEXT NOT NULL DEFAULT 'sent',
    CONSTRAINT uq_weekly_reminders UNIQUE (weekly_report_id, member_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reminders_lookup ON public.weekly_reminders(weekly_report_id, member_id, reminder_type);

-- 7. CRON JOB LOGS (AUTOMATION OBSERVABILITY)
CREATE TABLE IF NOT EXISTS public.cron_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
    members_processed INTEGER DEFAULT 0,
    notifications_sent INTEGER DEFAULT 0,
    report_generated BOOLEAN DEFAULT false,
    details JSONB,
    error_message TEXT,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_cron_job_logs_exec ON public.cron_job_logs(executed_at DESC);

-- 8. ROW LEVEL SECURITY
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_member_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

-- 8.1 weekly_reports Policies
-- All authenticated users can view weekly reports
CREATE POLICY "Authenticated users can view weekly reports"
    ON public.weekly_reports FOR SELECT
    TO authenticated
    USING (true);

-- Leadership or server can manage weekly reports
CREATE POLICY "Leadership can manage weekly reports"
    ON public.weekly_reports FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('captain', 'vice_captain')
        )
    );

-- 8.2 team_weekly_reports Policies
-- All authenticated users can view team weekly reports
CREATE POLICY "Authenticated users can view team weekly reports"
    ON public.team_weekly_reports FOR SELECT
    TO authenticated
    USING (true);

-- Leadership or server can manage team weekly reports
CREATE POLICY "Leadership can manage team weekly reports"
    ON public.team_weekly_reports FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('captain', 'vice_captain')
        )
    );

-- 8.3 member_weekly_reports Policies
-- Leadership can view all individual member reports
CREATE POLICY "Leadership can view all member weekly reports"
    ON public.member_weekly_reports FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('captain', 'vice_captain', 'manager', 'strategist')
        )
    );

-- Members can view ONLY their own individual reports
CREATE POLICY "Members can view own weekly reports"
    ON public.member_weekly_reports FOR SELECT
    TO authenticated
    USING (member_id = auth.uid());

-- Leadership or server can manage member weekly reports
CREATE POLICY "Leadership can manage member weekly reports"
    ON public.member_weekly_reports FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('captain', 'vice_captain')
        )
    );

-- 8.4 weekly_member_updates Policies
-- Members can view and insert their own weekly updates
CREATE POLICY "Members can insert own weekly updates"
    ON public.weekly_member_updates FOR INSERT
    TO authenticated
    WITH CHECK (member_id = auth.uid());

CREATE POLICY "Members can view own weekly updates"
    ON public.weekly_member_updates FOR SELECT
    TO authenticated
    USING (member_id = auth.uid());

-- Leadership can view all weekly updates
CREATE POLICY "Leadership can view all weekly updates"
    ON public.weekly_member_updates FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('captain', 'vice_captain', 'manager', 'strategist')
        )
    );

-- 8.5 weekly_reminders Policies
CREATE POLICY "Members can view own reminders"
    ON public.weekly_reminders FOR SELECT
    TO authenticated
    USING (member_id = auth.uid());

CREATE POLICY "Leadership can view all reminders"
    ON public.weekly_reminders FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('captain', 'vice_captain')
        )
    );

-- 8.6 cron_job_logs Policies
CREATE POLICY "Leadership can view cron job logs"
    ON public.cron_job_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('captain', 'vice_captain')
        )
    );
