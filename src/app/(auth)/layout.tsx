import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-14 items-center justify-between px-6 border-b border-border/70 backdrop-blur-md bg-background/80">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-xs tracking-tight text-foreground"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-[10px] shadow-xs">
            TP
          </div>
          <span>Team Portal</span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[400px] animate-fade-in">{children}</div>
      </main>
      <footer className="py-4 text-center text-[11px] text-muted-foreground border-t border-border/70">
        Team Portal &bull; Team Operations &amp; Performance
      </footer>
    </div>
  );
}
