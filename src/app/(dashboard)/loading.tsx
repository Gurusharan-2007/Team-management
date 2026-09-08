export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-col p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded bg-muted"></div>
          <div className="h-4 w-72 rounded bg-muted/60"></div>
        </div>
        <div className="h-9 w-28 rounded bg-muted"></div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-border/60 bg-muted/40 p-4 space-y-3">
            <div className="h-3.5 w-24 rounded bg-muted"></div>
            <div className="h-6 w-16 rounded bg-muted"></div>
            <div className="h-3 w-32 rounded bg-muted/50"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-72 rounded-xl border border-border/60 bg-muted/30 p-6"></div>
        <div className="h-72 rounded-xl border border-border/60 bg-muted/30 p-6"></div>
      </div>
    </div>
  );
}
