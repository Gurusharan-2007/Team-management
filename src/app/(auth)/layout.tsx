import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AmbientBackground } from "@/components/layout/ambient-background";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-200">
      {/* Dynamic Cosmic Aurora Background */}
      <AmbientBackground />

      <header className="relative z-10 flex h-16 items-center justify-between px-6 border-b border-border/50 backdrop-blur-xl bg-background/60">
        <Link
          href="/"
          className="flex items-center gap-3 font-bold text-sm tracking-tight text-foreground group"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-glow-cyan transition-transform group-hover:scale-105 duration-200">
            <svg
              className="h-4 w-4 text-white drop-shadow"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text">
              Team Portal
            </span>
            <span className="text-[10px] font-medium text-muted-foreground -mt-1">
              Engineering Workspace
            </span>
          </div>
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[420px] animate-fade-in">{children}</div>
      </main>

      <footer className="relative z-10 py-5 text-center text-xs text-muted-foreground/80 border-t border-border/50 backdrop-blur-md bg-background/40">
        Team Portal &bull; Build &bull; Learn &bull; Grow &bull; Together
      </footer>
    </div>
  );
}
