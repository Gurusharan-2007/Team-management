import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/database";

function sanitizeUrl(url: string | undefined): string {
  if (!url) return "";
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

export function isSupabaseConfigured(): boolean {
  const url = sanitizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return (
    Boolean(url) &&
    Boolean(key) &&
    !url.includes("placeholder-project") &&
    !key?.includes("placeholder-key")
  );
}

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const url = sanitizeUrl(rawUrl);
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createBrowserClient<Database>(url, key);
}
