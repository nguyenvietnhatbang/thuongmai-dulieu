export default function DashboardLoading() {
  return (
    <div className="h-full overflow-hidden">
      <div className="space-y-5 animate-pulse">
        <div className="space-y-2">
          <div className="h-5 w-56 rounded bg-slate-200" />
          <div className="h-3 w-80 rounded bg-slate-100" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 rounded-xl border border-border bg-white" />
          <div className="h-24 rounded-xl border border-border bg-white" />
          <div className="h-24 rounded-xl border border-border bg-white" />
        </div>

        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="h-12 border-b border-border bg-slate-50" />
          <div className="divide-y divide-border">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="h-14 bg-white" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
