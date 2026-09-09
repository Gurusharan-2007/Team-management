-- Migration 00009: Captain Member Removal Permission and RLS Policy
-- Allows authenticated active Captains to safely remove team members,
-- with database-level self-deletion and last-Captain protection.

-- 1. Update DELETE policy on public.profiles: Allow active Captains to delete profiles
DROP POLICY IF EXISTS "Prevent delete on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Captains can delete profiles" ON public.profiles;

CREATE POLICY "Captains can delete profiles"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
            AND public.profiles.role = 'captain'
            AND public.profiles.status = 'active'
        )
    );

-- 2. Secure RPC function as atomic deletion method
CREATE OR REPLACE FUNCTION public.delete_member_by_captain(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    caller_role TEXT;
    caller_status TEXT;
    target_role TEXT;
    target_status TEXT;
    active_captain_count INTEGER;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required: User is not authenticated.';
    END IF;

    -- Verify caller is active Captain
    SELECT role, status INTO caller_role, caller_status
    FROM public.profiles
    WHERE id = auth.uid();

    IF caller_role <> 'captain' OR caller_status <> 'active' THEN
        RAISE EXCEPTION 'Unauthorized: Only an active Captain can delete team members.';
    END IF;

    -- Self-deletion prevention
    IF auth.uid() = target_user_id THEN
        RAISE EXCEPTION 'Operation rejected: You cannot delete your own account.';
    END IF;

    -- Fetch target details
    SELECT role, status INTO target_role, target_status
    FROM public.profiles
    WHERE id = target_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target member not found.';
    END IF;

    -- Last Captain protection
    IF target_role = 'captain' AND target_status = 'active' THEN
        SELECT count(*) INTO active_captain_count
        FROM public.profiles
        WHERE role = 'captain' AND status = 'active' AND id <> target_user_id;

        IF active_captain_count < 1 THEN
            RAISE EXCEPTION 'Operation rejected: Cannot delete the last active Captain in the organization.';
        END IF;
    END IF;

    -- Cascade deletion across profiles (child tables cascade automatically via foreign keys)
    DELETE FROM public.profiles WHERE id = target_user_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.delete_member_by_captain(UUID) TO authenticated;
