import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/database";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/team",
  "/profile",
  "/reports",
  "/leaderboard",
  "/notifications",
  "/activity",
  "/settings",
];

const AUTH_ROUTES = ["/login", "/signup"];

type CookieOptions = {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  sameSite?: true | false | "lax" | "strict" | "none";
  httpOnly?: boolean;
  secure?: boolean;
};

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const url = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const isConfigured =
    Boolean(url) &&
    Boolean(key) &&
    !url.includes("placeholder-project") &&
    !key.includes("placeholder-key");

  // If Supabase is not yet configured, allow navigation for local preview/development only
  if (!isConfigured) {
    if (process.env.NODE_ENV === "production") {
      const pathname = request.nextUrl.pathname;
      const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
        pathname.startsWith(route)
      );
      if (isProtectedRoute) {
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("error", "DatabaseNotConfigured");
        return NextResponse.redirect(redirectUrl);
      }
    }
    return response;
  }

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: CookieOptions;
        }[]
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Do NOT use supabase.auth.getSession() in middleware as it is not guaranteed
  // to be secure. Use supabase.auth.getUser() instead.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
