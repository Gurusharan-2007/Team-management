import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-14 items-center justify-between px-6 border-b border-border/40">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-xs tracking-tight"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded bg-foreground text-background font-bold text-[10px]">
            AN
          </div>
          <span>Team Portal</span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[380px] animate-fade-in">{children}</div>
      </main>
      <footer className="py-4 text-center text-[11px] text-muted-foreground border-t border-border/40">
        Internal College Management Application
      </footer>
    </div>
  );
}
