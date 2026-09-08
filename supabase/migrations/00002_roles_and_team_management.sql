-- ==============================================================================
-- College Team Management System - Step 2: Roles, Permissions & Team Management
-- ==============================================================================

-- 1. EXTEND PROFILES TABLE WITH STATUS AND CURRENT POINT BALANCES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS activity_points INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS reward_points INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- 2. AUDIT LOGS TABLE FOR TEAM MANAGEMENT ACTIONS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    affected_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN (
        'role_changed',
        'member_deactivated',
        'member_activated',
        'member_updated',
        'member_created',
        'points_adjusted'
    )),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON public.audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_affected_user ON public.audit_logs(affected_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- 3. FUNCTION & TRIGGER TO PREVENT SELF-ROLE ESCALATION OR POINT MANIPULATION
CREATE OR REPLACE FUNCTION public.check_profile_update()
RETURNS TRIGGER AS $$
DECLARE
    caller_role TEXT;
BEGIN
    -- Retrieve the caller's role securely
    caller_role := public.get_auth_user_role();

    -- If caller is updating their own record and is not captain/vice_captain, protect privileged fields
    IF auth.uid() = OLD.id AND (caller_role IS NULL OR caller_role NOT IN ('captain', 'vice_captain')) THEN
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Security violation: Members cannot alter their own role.';
        END IF;

        IF NEW.activity_points IS DISTINCT FROM OLD.activity_points OR NEW.reward_points IS DISTINCT FROM OLD.reward_points THEN
            RAISE EXCEPTION 'Security violation: Members cannot alter point balances directly.';
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

DROP TRIGGER IF EXISTS trigger_check_profile_update ON public.profiles;
CREATE TRIGGER trigger_check_profile_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.check_profile_update();

-- 4. FUNCTION & TRIGGER TO PROTECT THE LAST ACTIVE CAPTAIN
CREATE OR REPLACE FUNCTION public.protect_last_captain()
RETURNS TRIGGER AS $$
DECLARE
    active_captain_count INTEGER;
BEGIN
    IF OLD.role = 'captain' AND OLD.status = 'active' THEN
        -- Check if operation would remove captain role or deactivate
        IF (TG_OP = 'UPDATE' AND (NEW.role <> 'captain' OR NEW.status <> 'active')) OR (TG_OP = 'DELETE') THEN
            SELECT COUNT(*) INTO active_captain_count
            FROM public.profiles
            WHERE role = 'captain' AND status = 'active' AND id <> OLD.id;

            IF active_captain_count = 0 THEN
                RAISE EXCEPTION 'Operation rejected: Cannot remove, demote, or deactivate the last active Captain.';
            END IF;
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_protect_last_captain ON public.profiles;
CREATE TRIGGER trigger_protect_last_captain
    BEFORE UPDATE OR DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_last_captain();

-- 5. FUNCTION TO BOOTSTRAP INITIAL CAPTAIN SECURELY
CREATE OR REPLACE FUNCTION public.bootstrap_initial_captain(target_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    captain_count INTEGER;
BEGIN
    -- Prevent execution if a Captain already exists in the system
    SELECT COUNT(*) INTO captain_count FROM public.profiles WHERE role = 'captain';
    IF captain_count > 0 THEN
        RAISE EXCEPTION 'Initial Captain already exists. Standard role management must be used.';
    END IF;

    UPDATE public.profiles
    SET role = 'captain',
        status = 'active',
        updated_at = TIMEZONE('utc', NOW())
    WHERE email = target_email;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with email % does not exist in profiles. User must register first.', target_email;
    END IF;

    -- Record in audit log
    INSERT INTO public.audit_logs (affected_user_id, action, metadata)
    SELECT id, 'role_changed', jsonb_build_object('reason', 'initial_bootstrap', 'new_role', 'captain')
    FROM public.profiles
    WHERE email = target_email;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. PREVENT HARD DELETION ON PROFILES (ENFORCE SOFT DEACTIVATION)
DROP POLICY IF EXISTS "Prevent delete on profiles" ON public.profiles;
CREATE POLICY "Prevent delete on profiles"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (false);

-- 7. AUDIT LOGS ROW LEVEL SECURITY POLICIES
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leadership can view all audit logs" ON public.audit_logs;
CREATE POLICY "Leadership can view all audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (
        public.get_auth_user_role() IN ('captain', 'vice_captain') OR
        affected_user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Leadership can insert audit logs" ON public.audit_logs;
CREATE POLICY "Leadership can insert audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        public.get_auth_user_role() IN ('captain', 'vice_captain')
    );
