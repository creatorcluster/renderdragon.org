-- Supabase-backed, first-party site analytics.
--
-- Replaces the old Cloudflare Worker + D1 tracker. Events are written by the
-- Vercel API routes (api/track.js) using the service role, and read back by
-- api/stats.js for the admin dashboard. RLS is enabled with no policies, so
-- the anon/authenticated roles can never read or write these tables directly;
-- the service role bypasses RLS.

create table if not exists public.analytics_visitors (
  visitor_key text primary key,
  user_id     uuid references auth.users(id) on delete set null,
  browser_id  text,
  first_seen  timestamptz not null default now(),
  last_seen   timestamptz not null default now(),
  visits      integer not null default 1
);

create table if not exists public.analytics_events (
  id          bigint generated always as identity primary key,
  visitor_key text not null,
  user_id     uuid references auth.users(id) on delete set null,
  browser_id  text,
  session_id  text,
  path        text,
  referrer    text,
  country     text,
  user_agent  text,
  is_new      boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_analytics_events_created_at on public.analytics_events (created_at desc);
create index if not exists idx_analytics_events_visitor_key on public.analytics_events (visitor_key);
create index if not exists idx_analytics_events_path on public.analytics_events (path);
create index if not exists idx_analytics_visitors_user_id on public.analytics_visitors (user_id);

alter table public.analytics_visitors enable row level security;
alter table public.analytics_events enable row level security;

-- Record a page view and update the visitor's rolling session state in one
-- atomic call. Returns whether this was a brand-new visitor and whether the
-- view started a new session (traffic dedupe happens by session window).
create or replace function public.analytics_track(
  p_visitor_key text,
  p_browser_id  text,
  p_user_id     uuid,
  p_session_id  text,
  p_path        text,
  p_referrer    text,
  p_country     text,
  p_user_agent  text,
  p_session_window_seconds integer default 1800
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.analytics_visitors%rowtype;
  v_is_new boolean := false;
  v_is_session boolean := true;
  v_now timestamptz := now();
begin
  if p_visitor_key is null or length(p_visitor_key) = 0 then
    raise exception 'visitor key required';
  end if;

  select * into v_existing
  from public.analytics_visitors
  where visitor_key = p_visitor_key
  for update;

  if not found then
    v_is_new := true;
    insert into public.analytics_visitors (visitor_key, user_id, browser_id)
    values (p_visitor_key, p_user_id, p_browser_id);
  else
    v_is_session := v_now - v_existing.last_seen > make_interval(secs => greatest(p_session_window_seconds, 0));
    update public.analytics_visitors
      set last_seen = v_now,
          visits = visits + case when v_is_session then 1 else 0 end,
          user_id = coalesce(p_user_id, user_id),
          browser_id = coalesce(nullif(p_browser_id, ''), browser_id)
      where visitor_key = p_visitor_key;
  end if;

  if v_is_session then
    insert into public.analytics_events (
      visitor_key, user_id, browser_id, session_id, path, referrer, country, user_agent, is_new
    ) values (
      p_visitor_key,
      p_user_id,
      nullif(p_browser_id, ''),
      nullif(p_session_id, ''),
      nullif(p_path, ''),
      nullif(p_referrer, ''),
      nullif(p_country, ''),
      nullif(p_user_agent, ''),
      v_is_new
    );
  end if;

  return jsonb_build_object('newVisitor', v_is_new, 'newSession', v_is_session);
end;
$$;

-- Aggregate stats for a range. Buckets are produced at the requested
-- granularity (day/week/month). Returns a single jsonb payload so the API
-- route can hand the result straight to the dashboard.
create or replace function public.analytics_overview(
  p_from        timestamptz,
  p_to          timestamptz,
  p_granularity text default 'day',
  p_top_limit   integer default 10
) returns jsonb
language sql
security definer
set search_path = public
as $$
  with filtered as (
    select *
    from public.analytics_events
    where created_at >= p_from and created_at < p_to
  ),
  totals as (
    select
      count(distinct visitor_key) filter (where is_new) as new_users,
      count(distinct visitor_key) filter (where not is_new) as returning_users,
      count(distinct visitor_key) as total_users,
      count(*) as visits
    from filtered
  ),
  buckets as (
    select
      date_trunc(
        case
          when p_granularity = 'month' then 'month'
          when p_granularity = 'week' then 'week'
          else 'day'
        end,
        created_at
      ) as bucket,
      count(distinct visitor_key) filter (where is_new) as new_users,
      count(distinct visitor_key) filter (where not is_new) as returning_users,
      count(distinct visitor_key) as uniques,
      count(*) as visits
    from filtered
    group by 1
    order by 1
  ),
  pages as (
    select path, count(*) as views
    from filtered
    where path is not null and path <> ''
    group by path
    order by views desc, path
    limit greatest(p_top_limit, 1)
  ),
  referrers as (
    select referrer, count(*) as views
    from filtered
    where referrer is not null and referrer <> ''
    group by referrer
    order by views desc, referrer
    limit greatest(p_top_limit, 1)
  )
  select jsonb_build_object(
    'from', p_from,
    'to', p_to,
    'granularity', p_granularity,
    'totals', jsonb_build_object(
      'newUsers', totals.new_users,
      'returningUsers', totals.returning_users,
      'totalUsers', totals.total_users,
      'visits', totals.visits
    ),
    'buckets', coalesce(
      (select jsonb_agg(
        jsonb_build_object(
          'bucket', b.bucket,
          'newUsers', b.new_users,
          'returningUsers', b.returning_users,
          'uniques', b.uniques,
          'visits', b.visits
        ) order by b.bucket
      ) from buckets b),
      '[]'::jsonb
    ),
    'topPages', coalesce(
      (select jsonb_agg(jsonb_build_object('path', p.path, 'views', p.views) order by p.views desc, p.path) from pages p),
      '[]'::jsonb
    ),
    'topReferrers', coalesce(
      (select jsonb_agg(jsonb_build_object('referrer', r.referrer, 'views', r.views) order by r.views desc, r.referrer) from referrers r),
      '[]'::jsonb
    )
  )
  from totals;
$$;

revoke all on function public.analytics_track(text, text, uuid, text, text, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.analytics_overview(timestamptz, timestamptz, text, integer) from public, anon, authenticated;

grant execute on function public.analytics_track(text, text, uuid, text, text, text, text, text, integer) to service_role;
grant execute on function public.analytics_overview(timestamptz, timestamptz, text, integer) to service_role;
