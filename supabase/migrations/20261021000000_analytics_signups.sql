-- Add Supabase auth signups to the admin analytics payload.
--
-- The original analytics_overview only reported first-party visitor traffic
-- (analytics_events), where "new users" means "first-time visitors". Those
-- numbers are browser/session based and intentionally do not require an
-- account, so they can never answer "how many people actually signed up?".
--
-- This adds a real signup series sourced from auth.users.created_at, both as
-- range totals (signups / confirmedSignups) and as a dense per-bucket series
-- (signupBuckets) so days without a signup show a real zero instead of a gap.
-- Anonymous (guest) accounts are excluded. Function is security definer and
-- only granted to service_role, matching the existing traffic function.

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
  with params as (
    select
      case
        when p_granularity = 'month' then 'month'
        when p_granularity = 'week' then 'week'
        else 'day'
      end::text as gran
  ),
  filtered as (
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
  ),
  signups as (
    select created_at, email_confirmed_at
    from auth.users
    where created_at >= p_from
      and created_at < p_to
      and not is_anonymous
  ),
  signup_totals as (
    select
      count(*) as signups,
      count(*) filter (where email_confirmed_at is not null) as confirmed
    from signups
  ),
  signup_counts as (
    select
      date_trunc((select gran from params), created_at) as bucket,
      count(*) as signups,
      count(*) filter (where email_confirmed_at is not null) as confirmed
    from signups
    group by 1
  ),
  signup_series as (
    select generate_series(
      date_trunc((select gran from params), p_from),
      date_trunc((select gran from params), p_to),
      case (select gran from params)
        when 'month' then interval '1 month'
        when 'week' then interval '1 week'
        else interval '1 day'
      end
    ) as bucket
  ),
  signup_buckets as (
    select
      s.bucket,
      coalesce(c.signups, 0) as signups,
      coalesce(c.confirmed, 0) as confirmed
    from signup_series s
    left join signup_counts c on c.bucket = s.bucket
    order by s.bucket
  )
  select jsonb_build_object(
    'from', p_from,
    'to', p_to,
    'granularity', (select gran from params),
    'totals', jsonb_build_object(
      'newUsers', totals.new_users,
      'returningUsers', totals.returning_users,
      'totalUsers', totals.total_users,
      'visits', totals.visits,
      'signups', signup_totals.signups,
      'confirmedSignups', signup_totals.confirmed
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
    'signupBuckets', coalesce(
      (select jsonb_agg(
        jsonb_build_object(
          'bucket', sb.bucket,
          'signups', sb.signups,
          'confirmed', sb.confirmed
        ) order by sb.bucket
      ) from signup_buckets sb),
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
  from totals, signup_totals;
$$;

revoke all on function public.analytics_overview(timestamptz, timestamptz, text, integer) from public, anon, authenticated;
grant execute on function public.analytics_overview(timestamptz, timestamptz, text, integer) to service_role;
