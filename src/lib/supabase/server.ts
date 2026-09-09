import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database, UserRole, Profile } from "@/types/database";

type CookieOptions = {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  sameSite?: true | false | "lax" | "strict" | "none";
  httpOnly?: boolean;
  secure?: boolean;
};

export async function createClient() {
  const cookieStore = cookies();

  const rawUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://placeholder-project.supabase.co";
  const url = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: CookieOptions;
        }[]
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // Can be safely ignored if middleware handles sessions.
        }
      },
    },
  });
}

export interface CurrentUserData {
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
    created_at?: string;
  } | null;
  profile: Profile | null;
  role: UserRole;
  isConfigured: boolean;
}

/**
 * Server-side helper to fetch current user and profile in a single operation.
 * Gracefully handles unconfigured local preview mode.
 */
export async function getCurrentUser(): Promise<CurrentUserData> {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const url = rawUrl ? rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "") : "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isConfigured =
    Boolean(url) &&
    Boolean(key) &&
    !url.includes("placeholder-project") &&
    !key?.includes("placeholder-key");

  if (!isConfigured) {
    if (process.env.NODE_ENV === "production") {
      if (process.env.NEXT_PHASE !== "phase-production-build") {
        console.warn(
          "Supabase configuration is missing or using placeholders in production environment."
        );
      }
      return {
        user: null,
        profile: null,
        role: "member",
        isConfigured: false,
      };
    }

    const cookieStore = cookies();
    const devAvatar = cookieStore.get("dev_avatar_url")?.value || null;
    const devName = cookieStore.get("dev_full_name")?.value || null;

    // Local preview fallback mock (development / non-production only)
    return {
      user: {
        id: "local-dev-user-id",
        email: "gurusharan@college.edu",
        user_metadata: { full_name: devName || "Gurusharan G" },
        created_at: new Date().toISOString(),
      },
      profile: {
        id: "local-dev-user-id",
        full_name: devName || "Gurusharan G",
        email: "gurusharan@college.edu",
        role: "captain",
        status: "active",
        activity_points: 0,
        reward_points: 0,
        avatar_url: devAvatar,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      role: "captain",
      isConfigured: false,
    };
  }

  try {
    const cookieStore = cookies();
    const devAvatar = cookieStore.get("dev_avatar_url")?.value || null;
    const devName = cookieStore.get("dev_full_name")?.value || null;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      if (process.env.NODE_ENV !== "production") {
        return {
          user: {
            id: "local-dev-user-id",
            email: "gurusharan@college.edu",
            user_metadata: { full_name: devName || "Gurusharan G" },
            created_at: new Date().toISOString(),
          },
          profile: {
            id: "local-dev-user-id",
            full_name: devName || "Gurusharan G",
            email: "gurusharan@college.edu",
            role: "captain",
            status: "active",
            activity_points: 0,
            reward_points: 0,
            avatar_url: devAvatar,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          role: "captain",
          isConfigured: true,
        };
      }

      return {
        user: null,
        profile: null,
        role: "member",
        isConfigured: true,
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const profileData = profile as Profile | null;
    if (profileData && devAvatar && !profileData.avatar_url) {
      profileData.avatar_url = devAvatar;
    }
    const role = (profileData?.role as UserRole) || "member";

    return {
      user,
      profile: profileData || null,
      role,
      isConfigured: true,
    };
  } catch {
    return {
      user: null,
      profile: null,
      role: "member",
      isConfigured: false,
    };
  }
}
