import { format, parseISO } from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  IconAlertTriangle,
  IconApi,
  IconClock,
  IconUsers,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { PartnerStats } from "@/lib/partners/client";

const callsConfig = {
  calls: { label: "Calls", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const errorsConfig = {
  errors: { label: "Errors", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

const usersConfig = {
  signIns: { label: "Sign-ins", color: "hsl(var(--chart-1))" },
  revocations: { label: "Revocations", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
const formatLatency = (value: number) => (value > 0 ? `${Math.round(value)} ms` : "—");

const formatDay = (date: string) => {
  const parsed = parseISO(date);
  return Number.isNaN(parsed.getTime()) ? date : format(parsed, "MMM d");
};

const formatEventTime = (ts: string) => {
  const parsed = parseISO(ts);
  return Number.isNaN(parsed.getTime()) ? ts : format(parsed, "MMM d, HH:mm:ss");
};

function Stat({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof IconUsers;
  accent: string;
}) {
  return (
    <div className="chamfer border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className={cn("size-4", accent)} aria-hidden />
      </div>
      <p className="mt-2 font-heading text-3xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: number | null }) {
  if (status === null) return <Badge variant="outline">Unknown</Badge>;
  if (status >= 500) return <Badge variant="destructive">{status}</Badge>;
  if (status >= 400) return <Badge variant="secondary">{status}</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export function PartnerStatsPanel({ stats }: { stats: PartnerStats }) {
  const daily = stats.daily.map((point) => ({
    ...point,
    label: formatDay(point.date),
  }));

  const userDaily = stats.userDaily.map((point) => ({
    ...point,
    label: formatDay(point.date),
  }));

  const hasUsage = stats.calls > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Signed-in users"
          value={stats.totalUsers.toLocaleString()}
          hint={`${stats.activeUsers} active in 30 days`}
          icon={IconUsers}
          accent="text-chart-3"
        />
        <Stat
          label="API calls (30d)"
          value={stats.calls.toLocaleString()}
          hint={stats.errors > 0 ? `${stats.errors.toLocaleString()} errors` : "No errors recorded"}
          icon={IconApi}
          accent="text-chart-4"
        />
        <Stat
          label="Error rate"
          value={formatPercent(stats.errorRate)}
          hint={hasUsage ? "Non-2xx responses" : "No calls recorded yet"}
          icon={IconAlertTriangle}
          accent="text-chart-5"
        />
        <Stat
          label="p95 latency"
          value={formatLatency(stats.p95LatencyMs)}
          hint={`${stats.activeKeys} active ${stats.activeKeys === 1 ? "key" : "keys"}`}
          icon={IconClock}
          accent="text-chart-2"
        />
      </div>

      {stats.totalUsers > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Sign-ins per day</CardTitle>
            <CardDescription>New authorizations and revocations over the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={usersConfig} className="aspect-auto h-[260px] w-full">
              <AreaChart data={userDaily} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="fill-partner-signins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-signIns)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="var(--color-signIns)" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="fill-partner-revocations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revocations)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-revocations)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <Area
                  dataKey="signIns"
                  type="monotone"
                  stroke="var(--color-signIns)"
                  strokeWidth={2}
                  fill="url(#fill-partner-signins)"
                  animationDuration={900}
                />
                <Area
                  dataKey="revocations"
                  type="monotone"
                  stroke="var(--color-revocations)"
                  strokeWidth={2}
                  fill="url(#fill-partner-revocations)"
                  animationDuration={900}
                  animationBegin={150}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {!hasUsage ? (
        <div className="chamfer border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="font-heading text-base font-semibold">No API activity yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            No API call telemetry has been recorded for this app in the last 30 days. Calls, errors,
            per-endpoint breakdowns and latency appear here once usage is recorded.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base">Calls per day</CardTitle>
                <CardDescription>Requests made with your keys over the last 30 days.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={callsConfig} className="aspect-auto h-[260px] w-full">
                  <AreaChart data={daily} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fill-partner-calls" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-calls)" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="var(--color-calls)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Area
                      dataKey="calls"
                      type="monotone"
                      stroke="var(--color-calls)"
                      strokeWidth={2}
                      fill="url(#fill-partner-calls)"
                      animationDuration={900}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base">Errors per day</CardTitle>
                <CardDescription>Non-2xx responses returned to your app.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={errorsConfig} className="aspect-auto h-[260px] w-full">
                  <BarChart data={daily} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Bar
                      dataKey="errors"
                      fill="var(--color-errors)"
                      radius={[4, 4, 0, 0]}
                      animationDuration={900}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base">Top endpoints</CardTitle>
                <CardDescription>Most requested endpoints in the selected window.</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.endpoints.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No endpoint data yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Endpoint</TableHead>
                        <TableHead className="text-right">Calls</TableHead>
                        <TableHead className="text-right">Errors</TableHead>
                        <TableHead className="text-right">p95</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.endpoints.map((endpoint) => (
                        <TableRow key={endpoint.endpoint}>
                          <TableCell
                            className="max-w-[220px] truncate font-mono text-xs"
                            title={endpoint.endpoint}
                          >
                            {endpoint.endpoint}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {endpoint.calls.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {endpoint.errors.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatLatency(endpoint.p95LatencyMs)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base">Response statuses</CardTitle>
                <CardDescription>HTTP status codes returned by your API calls.</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.statuses.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No status data yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Calls</TableHead>
                        <TableHead className="text-right">Share</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.statuses.map((entry) => (
                        <TableRow key={entry.status ?? "unknown"}>
                          <TableCell>
                            <StatusBadge status={entry.status} />
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {entry.calls.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatPercent(entry.calls / stats.calls)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">Daily breakdown</CardTitle>
              <CardDescription>Per day over the last 30 days (UTC).</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[420px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                    <TableHead className="text-right">Errors</TableHead>
                    <TableHead className="text-right">Error rate</TableHead>
                    <TableHead className="text-right">p95 latency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...daily].reverse().map((point) => (
                    <TableRow key={point.date}>
                      <TableCell className="font-mono text-xs">{point.label}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {point.calls.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {point.errors.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {point.calls > 0 ? formatPercent(point.errors / point.calls) : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatLatency(point.p95LatencyMs)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">Recent API activity</CardTitle>
              <CardDescription>The latest requests recorded for your organization.</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[420px] overflow-auto">
              {stats.recentEvents.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No events recorded yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Latency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentEvents.map((event, index) => (
                      <TableRow key={`${event.ts}-${index}`}>
                        <TableCell className="whitespace-nowrap font-mono text-xs">
                          {formatEventTime(event.ts)}
                        </TableCell>
                        <TableCell className="text-xs">{event.type}</TableCell>
                        <TableCell
                          className="max-w-[220px] truncate font-mono text-xs"
                          title={event.endpoint ?? undefined}
                        >
                          {event.endpoint ?? "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={event.status} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatLatency(event.latency_ms ?? 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
