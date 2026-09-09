import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck, BarChart3, Award, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function HomePage() {
  if (process.env.NODE_ENV !== "production") {
    redirect("/dashboard");
  }
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Navigation */}
      <header className="flex h-14 items-center justify-between border-b border-border/70 px-6 sm:px-12 backdrop-blur-md bg-background/80 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-xs">
            TP
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">Team Portal</span>
          <Badge variant="subtle" className="text-[10px] hidden sm:inline-flex">
            v1.0 Active
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild className="text-xs">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button size="sm" asChild className="text-xs">
            <Link href="/signup">Join Team</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 sm:py-28 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/50 px-3.5 py-1 text-xs text-muted-foreground mb-6 shadow-xs">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
          <span className="font-medium">Team Operations &amp; Performance</span>
          <span className="text-border">|</span>
          <span className="font-mono text-[11px] text-foreground">Live Telemetry</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground max-w-2xl leading-tight sm:leading-tight">
          Modern Team Operations &amp; Performance Analytics
        </h1>

        <p className="mt-4 max-w-xl text-sm sm:text-base text-muted-foreground leading-relaxed">
          The centralized workspace for Captains, Managers, Strategists, and Members to manage weekly snapshot reports, verifiable point ledgers, course certifications, and milestone achievements.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="text-sm font-medium shadow-sm">
            <Link href="/dashboard">
              Open Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg" className="text-sm font-medium">
            <Link href="/login">Member Login</Link>
          </Button>
        </div>

        {/* Feature Capability Highlights */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full text-left">
          <div className="rounded-xl border border-border/70 bg-card p-5 shadow-xs transition-all duration-200 hover:border-border hover:shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-muted/40 text-primary mb-3">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Weekly Reports
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Historical weekly snapshots separated from current balances for verifiable trend analytics.
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-5 shadow-xs transition-all duration-200 hover:border-border hover:shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-muted/40 text-amber-500 mb-3">
              <Award className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Points &amp; Auditing
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Distinct Activity and Reward point tracking with immutable audit trail and reason logs.
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-5 shadow-xs transition-all duration-200 hover:border-border hover:shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-muted/40 text-blue-500 mb-3">
              <BookOpen className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Technical Courses
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Structured course completions mapping technical skill growth across team disciplines.
            </p>
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-5 shadow-xs transition-all duration-200 hover:border-border hover:shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-muted/40 text-emerald-500 mb-3">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Role-Based Access
            </h3>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
              Granular permissions for Captain, Vice Captain, Manager, Strategist, and Members.
            </p>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border/70 py-6 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
        <span>&copy; {new Date().getFullYear()} Team Portal. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hover:text-foreground transition-colors">
            Login
          </Link>
          <Link href="/signup" className="hover:text-foreground transition-colors">
            Signup
          </Link>
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Workspace
          </Link>
        </div>
      </footer>
    </div>
  );
}
