import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PartnerStats } from "@/lib/partners/client";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="chamfer border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-heading text-3xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function PartnerStatsPanel({ stats }: { stats: PartnerStats }) {
  const max = Math.max(1, ...stats.dailyCalls.map((day) => day.calls));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Signed-in users" value={String(stats.totalUsers)} hint={`${stats.activeUsers} active in 30 days`} />
        <Stat label="API calls (30d)" value={stats.calls.toLocaleString()} />
        <Stat
          label="Error rate"
          value={`${(stats.errorRate * 100).toFixed(1)}%`}
          hint={stats.calls > 0 ? undefined : "No calls recorded yet"}
        />
        <Stat
          label="p95 latency"
          value={stats.p95LatencyMs > 0 ? `${Math.round(stats.p95LatencyMs)} ms` : "—"}
          hint={`${stats.activeKeys} active ${stats.activeKeys === 1 ? "key" : "keys"}`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Calls over the last 30 days</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.calls === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No calls yet. Once your key is in use, daily calls show up here.
            </p>
          ) : (
            <div className="flex h-40 items-end gap-1">
              {stats.dailyCalls.map((day) => (
                <div
                  key={day.date}
                  className={cn(
                    "flex-1 chamfer bg-primary/70 transition-colors hover:bg-primary",
                    day.calls === 0 && "bg-muted",
                  )}
                  style={{ height: `${Math.max(2, (day.calls / max) * 100)}%` }}
                  title={`${day.date}: ${day.calls} calls`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
