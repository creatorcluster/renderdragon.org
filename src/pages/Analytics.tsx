import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import {
  IconChartAreaLine,
  IconExternalLink,
  IconEye,
  IconFileText,
  IconRefresh,
  IconUserCheck,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { isAdminEmail } from "@/lib/admin";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchAnalyticsStats, type Granularity } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const usersConfig = {
  newUsers: { label: "New", color: "hsl(var(--chart-1))" },
  returningUsers: { label: "Returning", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const visitsConfig = {
  visits: { label: "Visits", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const RANGES = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
  { label: "12mo", value: 365 },
] as const;

const formatBucket = (granularity: Granularity, bucket: string): string => {
  const date = parseISO(bucket);
  if (Number.isNaN(date.getTime())) return bucket;
  if (granularity === "month") return format(date, "MMM yyyy");
  if (granularity === "week") return `w/c ${format(date, "MMM d")}`;
  return format(date, "MMM d");
};

const prettyReferrer = (referrer: string): string => {
  try {
    const url = new URL(referrer);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return referrer;
  }
};

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
  const { user, session, loading } = useAuth();
  const [days, setDays] = useState<number>(30);
  const [granularity, setGranularity] = useState<Granularity>("day");

  const accessToken = session?.access_token ?? "";

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["analytics-stats", accessToken, days, granularity],
    queryFn: () => fetchAnalyticsStats(accessToken, { days, granularity }),
    enabled: accessToken.length > 0,
    retry: false,
    staleTime: 60_000,
  });

  const buckets = useMemo(
    () =>
      (data?.buckets ?? []).map((point) => ({
        ...point,
        label: formatBucket(granularity, point.bucket),
      })),
    [data, granularity],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="cow-grid-bg flex-grow pb-16 pt-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              <DashboardSkeleton />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || !isAdminEmail(user.email)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Helmet>
        <title>Analytics - Renderdragon</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

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

              <div className="flex flex-wrap items-center gap-2">
                <ToggleGroup
                  value={granularity}
                  onValueChange={(value) => value && setGranularity(value as Granularity)}
                  variant="outline"
                >
                  <ToggleGroupItem value="day">Daily</ToggleGroupItem>
                  <ToggleGroupItem value="week">Weekly</ToggleGroupItem>
                  <ToggleGroupItem value="month">Monthly</ToggleGroupItem>
                </ToggleGroup>
                <ToggleGroup
                  value={String(days)}
                  onValueChange={(value) => value && setDays(Number(value))}
                  variant="outline"
                >
                  {RANGES.map((range) => (
                    <ToggleGroupItem key={range.value} value={String(range.value)}>
                      {range.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Refresh">
                  <IconRefresh className={cn("size-4", isFetching && "animate-spin")} />
                </Button>
              </div>
            </div>

            {isPending ? (
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
                    <StatCard label="New users" value={data.totals.newUsers} icon={IconUserPlus} accent="text-chart-1" index={0} />
                    <StatCard label="Returning users" value={data.totals.returningUsers} icon={IconUserCheck} accent="text-chart-2" index={1} />
                    <StatCard label="Unique visitors" value={data.totals.totalUsers} icon={IconUsers} accent="text-chart-3" index={2} />
                    <StatCard label="Visits" value={data.totals.visits} icon={IconEye} accent="text-chart-4" index={3} />
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>New vs returning</CardTitle>
                      <CardDescription>Distinct visitors per {granularity} (UTC)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={usersConfig} className="aspect-auto h-[300px] w-full">
                        <AreaChart data={buckets} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
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
                      <CardTitle>Visits per {granularity}</CardTitle>
                      <CardDescription>Sessions started each {granularity} (UTC)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={visitsConfig} className="aspect-auto h-[260px] w-full">
                        <BarChart data={buckets} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
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

                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IconFileText className="size-5 text-cow-purple" />
                          Most viewed pages
                        </CardTitle>
                        <CardDescription>Top pages by views in range</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {data.topPages.length === 0 ? (
                          <p className="py-6 text-center text-sm text-muted-foreground">No page views yet.</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Page</TableHead>
                                <TableHead className="text-right">Views</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.topPages.map((page) => (
                                <TableRow key={page.path}>
                                  <TableCell className="max-w-[320px] truncate font-jetbrains-mono text-xs" title={page.path}>
                                    {page.path}
                                  </TableCell>
                                  <TableCell className="text-right">{page.views.toLocaleString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IconExternalLink className="size-5 text-cow-purple" />
                          Top referrers
                        </CardTitle>
                        <CardDescription>Where traffic comes from</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {data.topReferrers.length === 0 ? (
                          <p className="py-6 text-center text-sm text-muted-foreground">No referrers recorded yet.</p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Source</TableHead>
                                <TableHead className="text-right">Visits</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {data.topReferrers.map((source) => (
                                <TableRow key={source.referrer}>
                                  <TableCell className="max-w-[320px] truncate" title={source.referrer}>
                                    {prettyReferrer(source.referrer)}
                                  </TableCell>
                                  <TableCell className="text-right">{source.views.toLocaleString()}</TableCell>
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
                      <CardTitle>Breakdown</CardTitle>
                      <CardDescription>
                        Per {granularity} over the last {days} days
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-[420px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Period</TableHead>
                            <TableHead className="text-right">New</TableHead>
                            <TableHead className="text-right">Returning</TableHead>
                            <TableHead className="text-right">Unique</TableHead>
                            <TableHead className="text-right">Visits</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {buckets.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                                No data for this range yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            [...buckets].reverse().map((point) => (
                              <TableRow key={point.bucket}>
                                <TableCell className="font-jetbrains-mono">{point.label}</TableCell>
                                <TableCell className="text-right">{point.newUsers}</TableCell>
                                <TableCell className="text-right">{point.returningUsers}</TableCell>
                                <TableCell className="text-right">{point.uniques}</TableCell>
                                <TableCell className="text-right">{point.visits}</TableCell>
                              </TableRow>
                            ))
                          )}
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
