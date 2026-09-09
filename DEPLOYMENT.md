# Apex Team Portal — Production Deployment Runbook

Comprehensive guide for provisioning, deploying, and maintaining the **College Team Management Application** in production.

---

## 1. Architecture Overview

- **Frontend / Fullstack**: Next.js 14 (App Router, React Server Components)
- **Database / Auth**: Supabase PostgreSQL with native Row Level Security (RLS) and GoTrue authentication
- **Session Layer**: SSR Cookie management via `@supabase/ssr`
- **Scheduled Automations**: HTTP webhook runner (`/api/cron/weekly-scheduler`) triggered by Supabase `pg_cron` or external HTTPS triggers.

---

## 2. Environment Variables Specification

Configure the following variables in your production hosting provider (e.g. Vercel, Supabase, Google Cloud Run):

### Public / Client-Safe Variables
| Variable Name | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | HTTPS URL of your Supabase project instance | `https://xyzproject.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Public anonymous API key (secured by RLS policies) | `eyJhbGciOi...` |
| `NEXT_PUBLIC_TEAM_TIMEZONE` | No | Centralized team timezone (default: `Asia/Kolkata`) | `Asia/Kolkata` |

### Server-Only Secrets (Never Expose to Browser)
| Variable Name | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `CRON_SECRET` | **Yes** | Secret bearer token for authorizing automated Saturday cron requests | High-entropy 32-byte string |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Service-role admin key for elevated maintenance tasks | `eyJhbGciOi...` |
| `TEAM_TIMEZONE` | No | Server fallback timezone | `Asia/Kolkata` |

---

## 3. Database Migration Sequence

Execute all migrations in chronological order against your production PostgreSQL database using the Supabase CLI, dashboard SQL Editor, or CI/CD migration pipeline:

1. `supabase/migrations/00001_initial_schema.sql`
   - Core tables: `profiles`, `courses`, `member_courses`, `point_history`, `audit_logs`, `notifications`.
2. `supabase/migrations/00002_roles_and_team_management.sql`
   - RBAC roles constraint, bootstrap function, initial RLS policies.
3. `supabase/migrations/00003_technical_courses_and_profile_management.sql`
   - Course catalog statuses (`active`, `archived`), foundational seed courses.
4. `supabase/migrations/00004_points_and_point_history.sql`
   - Stored procedure `adjust_member_points` for atomic balance adjustments and history logging.
5. `supabase/migrations/00005_goals_and_dashboard_analytics.sql`
   - Team and individual targets/goals with scopes and progress tracking.
6. `supabase/migrations/00006_weekly_snapshots_and_reports.sql`
   - Immutable weekly snapshot tables (`weekly_reports`, `member_weekly_reports`, `team_weekly_reports`, `weekly_member_updates`, `weekly_reminders`, `cron_job_logs`).
7. `supabase/migrations/00007_leaderboard_and_achievements.sql`
   - Milestone definitions, achievement auto-award engine, ranking views.
8. `supabase/migrations/00008_notifications_settings_and_hardening.sql`
   - `team_settings` table, notification action URLs, and trigger `trg_protect_last_captain` preventing demotion of the final Captain.
9. `supabase/migrations/00009_captain_delete_member.sql`
   - Captain member removal permission, RLS policy on profiles, and secure atomic deletion function `delete_member_by_captain`.

---

## 4. Initial Captain Account Bootstrap

To designate the initial Captain without manual database edits:
1. Have the college team Captain register an account via `/signup` with their college email address.
2. In the Supabase SQL Editor, run:
   ```sql
   SELECT public.bootstrap_initial_captain('captain@college.edu');
   ```
   *(Or invoke `bootstrapCaptainAction({ targetEmail: "captain@college.edu" })` through server action).*
3. The Captain will now have full administrative privileges and can assign roles to Vice Captain, Managers, Strategists, and Members.

---

## 5. Scheduled Automation Setup (Saturday Workflow)

The team reporting schedule runs exclusively on **Saturday** in the configured timezone:
- **11:00 AM**: First reminder for members with pending updates
- **4:00 PM**: Second reminder for members with pending updates
- **6:00 PM**: Final reminder for members with pending updates
- **8:00 PM**: Automated generation of immutable weekly team and member snapshot reports

### Option A: Supabase pg_cron (Recommended)
Enable `pg_cron` and `pg_net` extensions in Supabase and run:

```sql
-- Run scheduler check hourly on Saturdays
SELECT cron.schedule(
    'weekly-saturday-scheduler',
    '0 11,16,18,20 * * 6',
    $$
    SELECT net.http_post(
        url := 'https://your-domain.com/api/cron/weekly-scheduler?action=auto',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true)
        )
    );
    $$
);
```

### Option B: External Cron (Google Cloud Scheduler / GitHub Actions / Vercel Cron)
Configure a scheduled HTTPS POST or GET request:
- **Target URL**: `https://your-domain.com/api/cron/weekly-scheduler?action=auto`
- **HTTP Header**: `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret: <CRON_SECRET>`
- **Frequency**: Hourly on Saturdays (or specific intervals: 11:00, 16:00, 18:00, 20:00).

---

## 6. Pre-Launch Verification Checklist

- [ ] All 8 SQL migrations applied successfully.
- [ ] RLS is enabled on all tables (`profiles`, `courses`, `member_courses`, `point_history`, `goals`, `weekly_reports`, `member_weekly_reports`, `team_weekly_reports`, `notifications`, `achievements`, `member_achievements`, `audit_logs`, `team_settings`).
- [ ] Initial Captain account bootstrapped and verified.
- [ ] `CRON_SECRET` configured in production environment.
- [ ] Test cron invocation verified: `curl -H "Authorization: Bearer <CRON_SECRET>" https://<domain>/api/cron/weekly-scheduler?action=auto` returns HTTP 200.
- [ ] Unauthorized request to cron endpoint returns HTTP 401.
- [ ] Open redirect test verified: visiting `/auth/callback?next=https://evil.com` defaults to `/dashboard`.
- [ ] Non-leadership users attempting to access `/activity` or `/settings` receive Access Denied.
- [ ] `npm run build` and `npm run typecheck` pass with 0 errors.
