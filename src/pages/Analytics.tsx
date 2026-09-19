import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import {
  IconChartAreaLine,
  IconEye,
  IconKey,
  IconRefresh,
  IconUserCheck,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchAnalyticsStats } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const TOKEN_KEY = "rd_stats_token";

const usersConfig = {
  newUsers: { label: "New", color: "hsl(var(--chart-1))" },
  returningUsers: { label: "Returning", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const visitsConfig = {
  visits: { label: "Visits", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const CountUp = ({ value }: { value: number }) => {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest).toLocaleString());

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.9, ease: "easeOut" });
    return () => controls.stop();
  }, [motionValue, value]);

  return <motion.span>{rounded}</motion.span>;
};

const StatCard = ({
  label,
  value,
  icon: Icon,
  accent,
  index,
}: {
  label: string;
  value: number;
  icon: typeof IconUsers;
  accent: string;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: index * 0.06 }}
  >
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardDescription>{label}</CardDescription>
        <Icon className={cn("size-5", accent)} />
      </CardHeader>
      <CardContent>
        <div className="font-jetbrains-mono text-3xl font-semibold">
          <CountUp value={value} />
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const DashboardSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-[116px] rounded-lg" />
      ))}
    </div>
    <Skeleton className="h-[320px] rounded-lg" />
    <Skeleton className="h-[280px] rounded-lg" />
  </div>
);

const Analytics = () => {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_KEY) ?? "");
  const [draft, setDraft] = useState("");
  const [days, setDays] = useState<7 | 30 | 90>(30);

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["analytics-stats", token, days],
    queryFn: () => fetchAnalyticsStats(token, days),
    enabled: token.length > 0,
    retry: false,
    staleTime: 60_000,
  });

  const unauthorized = isError && error instanceof Error && error.message === "unauthorized";

  const chartData = useMemo(
    () =>
      [...(data?.daily ?? [])]
        .reverse()
        .map((point) => ({ ...point, label: format(parseISO(point.day), "MMM d") })),
    [data],
  );

  const saveToken = (event: FormEvent) => {
    event.preventDefault();
    const next = draft.trim();
    if (!next) return;
    window.localStorage.setItem(TOKEN_KEY, next);
    setToken(next);
    setDraft("");
  };

  const clearToken = () => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken("");
  };

  const showGate = token.length === 0 || unauthorized;

  return (
    <div className="flex min-h-screen flex-col">
      <Helmet>
        <title>Analytics - Renderdragon</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Navbar />

      <main className="cow-grid-bg flex-grow pb-16 pt-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-6xl"
          >
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <IconChartAreaLine className="size-8 text-cow-purple" />
                <h1 className="font-minecraftia text-4xl md:text-5xl">
                  Traffic <span className="text-cow-purple">Analytics</span>
                </h1>
              </div>

              {!showGate && (
                <div className="flex items-center gap-2">
                  <ToggleGroup
                    value={String(days)}
                    onValueChange={(value) => value && setDays(Number(value) as 7 | 30 | 90)}
                    variant="outline"
                  >
                    <ToggleGroupItem value="7">7d</ToggleGroupItem>
                    <ToggleGroupItem value="30">30d</ToggleGroupItem>
                    <ToggleGroupItem value="90">90d</ToggleGroupItem>
                  </ToggleGroup>
                  <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Refresh">
                    <IconRefresh className={cn("size-4", isFetching && "animate-spin")} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={clearToken} aria-label="Forget token">
                    <IconKey className="size-4" />
                  </Button>
                </div>
              )}
            </div>

            {showGate ? (
              <Card className="mx-auto max-w-md">
                <CardHeader>
                  <CardTitle>Stats token</CardTitle>
                  <CardDescription>
                    Enter the STATS_TOKEN you set for the analytics worker. It stays in this browser only.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={saveToken} className="flex flex-col gap-3">
                    <Input
                      type="password"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="STATS_TOKEN"
                      aria-invalid={unauthorized}
                      autoFocus
                    />
                    {unauthorized && (
                      <p className="text-sm text-destructive">That token was rejected. Try again.</p>
                    )}
                    <Button type="submit">View analytics</Button>
                  </form>
                </CardContent>
              </Card>
            ) : isPending ? (
              <DashboardSkeleton />
            ) : isError ? (
              <Alert variant="destructive">
                <AlertTitle>Could not load analytics</AlertTitle>
                <AlertDescription>
                  {error instanceof Error ? error.message : "Unknown error"}
                </AlertDescription>
              </Alert>
            ) : (
              data && (
                <div className="flex flex-col gap-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="New users" value={data.newUsers} icon={IconUserPlus} accent="text-chart-1" index={0} />
                    <StatCard label="Returning users" value={data.returningUsers} icon={IconUserCheck} accent="text-chart-2" index={1} />
                    <StatCard label="Unique users" value={data.totalUsers} icon={IconUsers} accent="text-chart-3" index={2} />
                    <StatCard label="Visits" value={data.visits} icon={IconEye} accent="text-chart-4" index={3} />
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>New vs returning</CardTitle>
                      <CardDescription>Distinct visitors per day (UTC)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={usersConfig} className="aspect-auto h-[300px] w-full">
                        <AreaChart data={chartData} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                          <defs>
                            <linearGradient id="fill-new" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-newUsers)" stopOpacity={0.5} />
                              <stop offset="95%" stopColor="var(--color-newUsers)" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="fill-returning" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-returningUsers)" stopOpacity={0.5} />
                              <stop offset="95%" stopColor="var(--color-returningUsers)" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} />
                          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                          <Area
                            dataKey="newUsers"
                            type="monotone"
                            stroke="var(--color-newUsers)"
                            strokeWidth={2}
                            fill="url(#fill-new)"
                            animationDuration={900}
                          />
                          <Area
                            dataKey="returningUsers"
                            type="monotone"
                            stroke="var(--color-returningUsers)"
                            strokeWidth={2}
                            fill="url(#fill-returning)"
                            animationDuration={900}
                            animationBegin={150}
                          />
                        </AreaChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Visits per day</CardTitle>
                      <CardDescription>Sessions started each day (UTC)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={visitsConfig} className="aspect-auto h-[260px] w-full">
                        <BarChart data={chartData} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                          <CartesianGrid vertical={false} />
                          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                          <Bar
                            dataKey="visits"
                            fill="var(--color-visits)"
                            radius={[4, 4, 0, 0]}
                            animationDuration={900}
                          />
                        </BarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Daily breakdown</CardTitle>
                      <CardDescription>Latest {chartData.length} days</CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-[420px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Day</TableHead>
                            <TableHead className="text-right">New</TableHead>
                            <TableHead className="text-right">Returning</TableHead>
                            <TableHead className="text-right">Visits</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...chartData].reverse().map((point) => (
                            <TableRow key={point.day}>
                              <TableCell className="font-jetbrains-mono">{point.day}</TableCell>
                              <TableCell className="text-right">{point.newUsers}</TableCell>
                              <TableCell className="text-right">{point.returningUsers}</TableCell>
                              <TableCell className="text-right">{point.visits}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Analytics;
