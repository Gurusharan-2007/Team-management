import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/config/site";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type"); // e.g. "signup", "email", "recovery"
  const rawNext = requestUrl.searchParams.get("next");

  // Strict open-redirect defense
  let next = "/dashboard";
  if (
    rawNext &&
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    !rawNext.startsWith("/\\") &&
    !rawNext.includes("://")
  ) {
    next = rawNext;
  }

  // Determine production-safe base URL
  let baseUrl = getSiteUrl();
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";

  if (
    forwardedHost &&
    !forwardedHost.includes("localhost") &&
    !forwardedHost.includes("127.0.0.1")
  ) {
    baseUrl = `${forwardedProto}://${forwardedHost}`;
  }

  const supabase = await createClient();

  // 1. Handle PKCE authorization code exchange
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  // 2. Handle OTP token_hash email verification
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  // 3. Fallback: Check if session is already established
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return NextResponse.redirect(`${baseUrl}${next}`);
  }

  // Return the user to login with error notification
  return NextResponse.redirect(`${baseUrl}/login?error=Authentication%20failed`);
}
