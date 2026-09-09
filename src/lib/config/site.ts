/**
 * Centralized Site URL & Auth Callback Configuration
 *
 * Ensures production verification links and auth callbacks strictly resolve to
 * the production application URL (https://teambmanagement.vercel.app),
 * while maintaining localhost support during local development.
 */

export function getSiteUrl(): string {
  // 1. Explicit environment variable configuration
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL;

  if (
    envUrl &&
    envUrl.trim() &&
    envUrl.trim() !== "undefined" &&
    envUrl.trim() !== "null"
  ) {
    const trimmed = envUrl.trim().replace(/\/+$/, "");
    return trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
  }

  // 2. Vercel deployment environment variables
  const vercelUrl =
    process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
  if (
    vercelUrl &&
    vercelUrl.trim() &&
    vercelUrl.trim() !== "undefined" &&
    vercelUrl.trim() !== "null"
  ) {
    const trimmed = vercelUrl.trim().replace(/\/+$/, "");
    return trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
  }

  // 3. Client-side browser inspection
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // In production or when hosted on custom domain / Vercel
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return window.location.origin.replace(/\/+$/, "");
    }
    // In local development, if running on localhost, preserve local origin
    if (process.env.NODE_ENV !== "production") {
      return window.location.origin.replace(/\/+$/, "");
    }
  }

  // 4. Fallback for production server runtime (ensures no localhost in production)
  if (process.env.NODE_ENV === "production") {
    return "https://teambmanagement.vercel.app";
  }

  // 5. Default fallback for local development
  return "http://localhost:3000";
}

/**
 * Returns the full callback URL for email verification and auth redirects.
 */
export function getAuthCallbackUrl(): string {
  const base = getSiteUrl();
  return `${base}/auth/callback`;
}
