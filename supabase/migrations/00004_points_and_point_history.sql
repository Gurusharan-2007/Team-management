-- ==============================================================================
-- Migration: 00004_points_and_point_history.sql
-- Description: Comprehensive point management, non-negative constraints,
--              atomic transactional stored procedure (adjust_member_points),
--              point_history source tracking, and strict RLS policies.
-- ==============================================================================

-- 1. ADD NON-NEGATIVE CONSTRAINTS TO PROFILES
-- Ensures points cannot become negative directly or through any update
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_activity_points_non_negative'
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT chk_profiles_activity_points_non_negative
            CHECK (activity_points >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_profiles_reward_points_non_negative'
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT chk_profiles_reward_points_non_negative
            CHECK (reward_points >= 0);
    END IF;
END $$;

-- 2. ENHANCE POINT_HISTORY TABLE
-- Add source column to distinguish between self_update and admin_adjustment
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'point_history' AND column_name = 'source'
    ) THEN
        ALTER TABLE public.point_history
            ADD COLUMN source VARCHAR(30) NOT NULL DEFAULT 'admin_adjustment'
            CHECK (source IN ('admin_adjustment', 'self_update'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'point_history' AND column_name = 'actor_role'
    ) THEN
        ALTER TABLE public.point_history
            ADD COLUMN actor_role VARCHAR(30) DEFAULT 'member';
    END IF;
END $$;

-- Add composite index for fast point history retrieval by member and time
CREATE INDEX IF NOT EXISTS idx_point_history_member_created
    ON public.point_history(member_id, created_at DESC);

-- 3. UPDATE PROFILE UPDATE TRIGGER TO PERMIT SECURE POINT TRANSACTIONS
CREATE OR REPLACE FUNCTION public.check_profile_update()
RETURNS TRIGGER AS $$
DECLARE
    caller_role TEXT;
    is_internal_point_op TEXT;
BEGIN
    -- Check if operation is running within the authorized adjust_member_points procedure
    is_internal_point_op := current_setting('app.point_update_in_progress', true);
    IF is_internal_point_op = 'true' THEN
        RETURN NEW;
    END IF;

    -- Fetch caller's current role
    caller_role := public.get_auth_user_role();

    -- Check if user is attempting to modify their own protected fields directly
    IF auth.uid() = OLD.id AND (caller_role IS NULL OR caller_role NOT IN ('captain', 'vice_captain')) THEN
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Security violation: Members cannot alter their own role.';
        END IF;

        IF NEW.activity_points IS DISTINCT FROM OLD.activity_points OR NEW.reward_points IS DISTINCT FROM OLD.reward_points THEN
            RAISE EXCEPTION 'Security violation: Point balances must be updated via the points management system.';
        END IF;

        IF NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Security violation: Members cannot change their account status.';
        END IF;
    END IF;

    -- Non-leadership users cannot update other profiles
    IF auth.uid() <> OLD.id AND (caller_role IS NULL OR caller_role NOT IN ('captain', 'vice_captain')) THEN
        RAISE EXCEPTION 'Security violation: You do not have permission to update other member profiles.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. ATOMIC POINT ADJUSTMENT STORED PROCEDURE
-- Handles locking (concurrency), authorization, zero-negative balance checks,
-- balance update, point_history creation, and audit logging atomically.
CREATE OR REPLACE FUNCTION public.adjust_member_points(
    p_target_member_id UUID,
    p_point_type TEXT,
    p_change_amount INTEGER,
    p_reason TEXT,
    p_source TEXT DEFAULT 'admin_adjustment'
)
RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID;
    v_caller_role TEXT;
    v_target_profile RECORD;
    v_previous_balance INTEGER;
    v_new_balance INTEGER;
    v_cleaned_reason TEXT;
    v_history_id UUID;
    v_audit_id UUID;
BEGIN
    -- 1. Verify authenticated session
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required: User is not authenticated.';
    END IF;

    -- Fetch caller role
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller_id AND status = 'active';
    IF v_caller_role IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Caller account does not exist or is inactive.';
    END IF;

    -- 2. Validate input parameters
    IF p_point_type NOT IN ('activity', 'reward') THEN
        RAISE EXCEPTION 'Invalid point type: % (must be ''activity'' or ''reward'')', p_point_type;
    END IF;

    IF p_change_amount = 0 THEN
        RAISE EXCEPTION 'Invalid change amount: Amount cannot be zero.';
    END IF;

    IF ABS(p_change_amount) > 100000 THEN
        RAISE EXCEPTION 'Invalid change amount: Amount exceeds maximum permissible threshold.';
    END IF;

    v_cleaned_reason := TRIM(p_reason);
    IF v_cleaned_reason IS NULL OR LENGTH(v_cleaned_reason) < 3 THEN
        RAISE EXCEPTION 'Validation error: Reason must be at least 3 characters long.';
    END IF;

    IF LENGTH(v_cleaned_reason) > 500 THEN
        RAISE EXCEPTION 'Validation error: Reason cannot exceed 500 characters.';
    END IF;

    IF p_source NOT IN ('admin_adjustment', 'self_update') THEN
        RAISE EXCEPTION 'Invalid source: % (must be ''admin_adjustment'' or ''self_update'')', p_source;
    END IF;

    -- 3. Enforce Permissions Model
    IF p_source = 'self_update' THEN
        IF v_caller_id <> p_target_member_id THEN
            RAISE EXCEPTION 'Security violation: Members may only submit point self-updates for their own account.';
        END IF;
    ELSE -- admin_adjustment
        IF v_caller_role NOT IN ('captain', 'vice_captain') THEN
            RAISE EXCEPTION 'Unauthorized: Only Captain and Vice Captain may perform administrative point adjustments.';
        END IF;
    END IF;

    -- 4. Lock target member row for update (prevents race conditions / lost updates)
    SELECT id, full_name, email, role, status, activity_points, reward_points
    INTO v_target_profile
    FROM public.profiles
    WHERE id = p_target_member_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target member not found.';
    END IF;

    IF v_target_profile.status <> 'active' AND p_source = 'self_update' THEN
        RAISE EXCEPTION 'Account is inactive. Inactive accounts cannot submit point updates.';
    END IF;

    -- 5. Calculate previous and new balances
    IF p_point_type = 'activity' THEN
        v_previous_balance := v_target_profile.activity_points;
    ELSE
        v_previous_balance := v_target_profile.reward_points;
    END IF;

    v_new_balance := v_previous_balance + p_change_amount;

    -- 6. Enforce Non-Negative Balance Rule
    IF v_new_balance < 0 THEN
        RAISE EXCEPTION 'Operation rejected: Balance cannot become negative (current: %, change: %, resulting: %).',
            v_previous_balance, p_change_amount, v_new_balance;
    END IF;

    -- 7. Set transaction-local flag so trigger permits the update
    PERFORM set_config('app.point_update_in_progress', 'true', true);

    -- 8. Atomically update target balance
    IF p_point_type = 'activity' THEN
        UPDATE public.profiles
        SET activity_points = v_new_balance,
            updated_at = TIMEZONE('utc', NOW())
        WHERE id = p_target_member_id;
    ELSE
        UPDATE public.profiles
        SET reward_points = v_new_balance,
            updated_at = TIMEZONE('utc', NOW())
        WHERE id = p_target_member_id;
    END IF;

    -- 9. Insert immutable point history record
    INSERT INTO public.point_history (
        member_id,
        point_type,
        previous_value,
        new_value,
        change_amount,
        reason,
        changed_by,
        source,
        actor_role,
        created_at
    ) VALUES (
        p_target_member_id,
        p_point_type,
        v_previous_balance,
        v_new_balance,
        p_change_amount,
        v_cleaned_reason,
        v_caller_id,
        p_source,
        v_caller_role,
        TIMEZONE('utc', NOW())
    ) RETURNING id INTO v_history_id;

    -- 10. Insert audit log record
    INSERT INTO public.audit_logs (
        performed_by,
        affected_user_id,
        action,
        metadata,
        created_at
    ) VALUES (
        v_caller_id,
        p_target_member_id,
        'points_adjusted',
        jsonb_build_object(
            'point_type', p_point_type,
            'previous_value', v_previous_balance,
            'new_value', v_new_balance,
            'change_amount', p_change_amount,
            'reason', v_cleaned_reason,
            'source', p_source,
            'actor_role', v_caller_role,
            'point_history_id', v_history_id
        ),
        TIMEZONE('utc', NOW())
    ) RETURNING id INTO v_audit_id;

    RETURN jsonb_build_object(
        'success', true,
        'target_member_id', p_target_member_id,
        'point_type', p_point_type,
        'previous_value', v_previous_balance,
        'new_value', v_new_balance,
        'change_amount', p_change_amount,
        'source', p_source,
        'point_history_id', v_history_id,
        'audit_log_id', v_audit_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. RLS POLICIES FOR POINT_HISTORY
ALTER TABLE public.point_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "point_history_select_policy" ON public.point_history;
CREATE POLICY "point_history_select_policy"
    ON public.point_history
    FOR SELECT
    USING (
        -- Captain, Vice Captain, Manager, and Strategist can view all point history
        public.get_auth_user_role() IN ('captain', 'vice_captain', 'manager', 'strategist')
        -- Members can view only their own point history
        OR member_id = auth.uid()
    );

-- Prevent any manual direct insert, update, or delete from clients
DROP POLICY IF EXISTS "point_history_insert_policy" ON public.point_history;
CREATE POLICY "point_history_insert_policy"
    ON public.point_history
    FOR INSERT
    WITH CHECK (
        -- Only leadership or the SECURITY DEFINER function can insert
        public.get_auth_user_role() IN ('captain', 'vice_captain')
        OR current_setting('app.point_update_in_progress', true) = 'true'
    );

-- Point history is strictly immutable: no updates or deletes permitted
DROP POLICY IF EXISTS "point_history_update_policy" ON public.point_history;
CREATE POLICY "point_history_update_policy"
    ON public.point_history
    FOR UPDATE
    USING (false);

DROP POLICY IF EXISTS "point_history_delete_policy" ON public.point_history;
CREATE POLICY "point_history_delete_policy"
    ON public.point_history
    FOR DELETE
    USING (false);
