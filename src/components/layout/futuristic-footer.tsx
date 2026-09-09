"use client";

import * as React from "react";

export function FuturisticFooter() {
  const [currentTime, setCurrentTime] = React.useState<string>("");

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const time = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setCurrentTime(`${formatted} | ${time}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer className="mt-12 border-t border-border/50 py-5 text-xs text-muted-foreground/80">
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex items-center gap-2 font-medium tracking-wide">
          <span className="font-semibold text-foreground/90">Team Portal</span>
          <span className="opacity-40">•</span>
          <span>Build</span>
          <span className="opacity-40">•</span>
          <span>Learn</span>
          <span className="opacity-40">•</span>
          <span>Grow</span>
          <span className="opacity-40">•</span>
          <span className="text-primary font-medium">Together</span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>
            {currentTime ? `Last updated: ${currentTime}` : "System active & synchronized"}
          </span>
        </div>
      </div>
    </footer>
  );
}
