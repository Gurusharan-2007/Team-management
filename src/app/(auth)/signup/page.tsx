"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { signupSchema } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Shield } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setErrorMsg(null);
    setSuccessMsg(null);

    const validation = signupSchema.safeParse({
      fullName,
      email,
      password,
      confirmPassword,
    });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    if (!isSupabaseConfigured()) {
      // In local preview mode
      setTimeout(() => {
        setSuccessMsg("Account created in preview mode! Redirecting to dashboard...");
        setTimeout(() => router.push("/dashboard"), 800);
      }, 500);
      return;
    }

    try {
      const supabase = createClient();
      // Public signup strictly registers users as 'member'
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: "member", // strictly non-privileged default
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setSuccessMsg(
          "Registration successful! Please check your email to confirm your account."
        );
        setLoading(false);
      }
    } catch {
      setErrorMsg("An unexpected error occurred during signup.");
      setLoading(false);
    }
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl">Create team account</CardTitle>
        <CardDescription>
          Register as a college team member to track your performance
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-3.5 pt-0">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label
              htmlFor="fullName"
              className="text-xs font-medium text-foreground"
            >
              Full Name
            </label>
            <Input
              id="fullName"
              placeholder="Alex Johnson"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={Boolean(fieldErrors.fullName)}
              required
            />
            {fieldErrors.fullName && (
              <p className="text-[11px] text-destructive">{fieldErrors.fullName}</p>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="email"
              className="text-xs font-medium text-foreground"
            >
              Email address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="alex@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={Boolean(fieldErrors.email)}
              autoComplete="email"
              required
            />
            {fieldErrors.email && (
              <p className="text-[11px] text-destructive">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="text-xs font-medium text-foreground"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={Boolean(fieldErrors.password)}
              autoComplete="new-password"
              required
            />
            {fieldErrors.password && (
              <p className="text-[11px] text-destructive">{fieldErrors.password}</p>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="confirmPassword"
              className="text-xs font-medium text-foreground"
            >
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={Boolean(fieldErrors.confirmPassword)}
              autoComplete="new-password"
              required
            />
            {fieldErrors.confirmPassword && (
              <p className="text-[11px] text-destructive">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* Role Security Notice */}
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
            <Shield className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>
              All new accounts are enrolled as <strong>Member</strong>. Leadership roles (Captain, Vice Captain, Manager, Strategist) are assigned by administration.
            </span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-2">
          <Button type="submit" className="w-full" loading={loading}>
            Create Account
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline underline-offset-4 hover:opacity-80"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
