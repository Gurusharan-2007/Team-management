import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

/**
 * Creates an administrative Supabase client using SUPABASE_SERVICE_ROLE_KEY if present,
 * bypassing Row Level Security for server-side jobs like scheduled cron executions.
 * Falls back to NEXT_PUBLIC_SUPABASE_ANON_KEY if service role key is not configured.
 */
export function createAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const url = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ADMIN_KEY;

  if (!serviceKey) {
    console.error(
      "[AdminClient] Privileged server credential missing. SUPABASE_SERVICE_ROLE_KEY is not configured in the environment."
    );
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Administrative client cannot fall back to anonymous credentials."
    );
  }

  return createSupabaseClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
