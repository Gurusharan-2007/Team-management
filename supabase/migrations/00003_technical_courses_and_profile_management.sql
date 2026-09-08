-- ==============================================================================
-- College Team Management System - Step 3: Technical Courses & Profile Management
-- ==============================================================================

-- 1. COURSES TABLE ENHANCEMENTS
-- Soft-archiving support for retired courses without breaking historical records
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL CHECK (status IN ('active', 'archived')) DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);

-- 2. AUDIT LOGS ACTION CONSTRAINT UPDATE
ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_action_check;

ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_action_check CHECK (action IN (
    'role_changed',
    'member_deactivated',
    'member_activated',
    'member_updated',
    'member_created',
    'points_adjusted',
    'course_added',
    'course_updated',
    'course_deactivated',
    'course_completed',
    'course_completion_removed',
    'profile_updated'
));

-- 3. SEED FOUNDATIONAL TECHNICAL COURSES
INSERT INTO public.courses (name, description, status)
VALUES 
    ('Python Fundamentals', 'Core Python programming, data structures, and algorithmic scripting.', 'active'),
    ('React & Next.js Development', 'Modern component architecture, server components, and state management.', 'active'),
    ('Git & Team Collaboration', 'Branching workflows, pull requests, merge conflict resolution, and code reviews.', 'active'),
    ('PostgreSQL & Database Design', 'Schema design, indexing, relationships, and performant SQL queries.', 'active'),
    ('Cloud Infrastructure & Docker', 'Containerization basics, Dockerfile optimization, and deployment patterns.', 'active'),
    ('TypeScript & Design Patterns', 'Type safety, generics, OOP principles, and clean code architecture.', 'active'),
    ('REST & API Architecture', 'Designing scalable RESTful endpoints, auth tokens, and status code best practices.', 'active')
ON CONFLICT DO NOTHING;

-- 4. REFINED RLS POLICIES FOR COURSES
DROP POLICY IF EXISTS "Authenticated users can view courses" ON public.courses;
CREATE POLICY "Authenticated users can view courses"
    ON public.courses FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Leadership can manage courses" ON public.courses;
CREATE POLICY "Leadership can manage courses"
    ON public.courses FOR ALL
    TO authenticated
    USING (public.get_auth_user_role() IN ('captain', 'vice_captain'));

-- 5. REFINED RLS POLICIES FOR MEMBER_COURSES
-- Authenticated users can view member courses
DROP POLICY IF EXISTS "Authenticated users can view member courses" ON public.member_courses;
CREATE POLICY "Authenticated users can view member courses"
    ON public.member_courses FOR SELECT
    TO authenticated
    USING (true);

-- Members can insert/delete only their own course records; Leadership can manage any member's courses
DROP POLICY IF EXISTS "Users can manage own member courses" ON public.member_courses;
CREATE POLICY "Users can manage own member courses"
    ON public.member_courses FOR ALL
    TO authenticated
    USING (
        auth.uid() = member_id OR 
        public.get_auth_user_role() IN ('captain', 'vice_captain')
    )
    WITH CHECK (
        auth.uid() = member_id OR 
        public.get_auth_user_role() IN ('captain', 'vice_captain')
    );
