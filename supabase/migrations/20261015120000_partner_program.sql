-- RenderDragon Partner Program
-- Invite-only partners: OAuth apps ("Sign in with RenderDragon"), read-only asset API
-- keys, consents (per-app user list) and usage events.
--
-- Privacy note: partner_consents stores the exact profile snapshot the user approved
-- at consent time. Partners read that snapshot through RLS and never get broad access
-- to auth.users or the profiles table.

create table if not exists public.partner_orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  verified boolean not null default false,
  verified_domain text,
  status text not null default 'active' check (status in ('invited', 'active', 'suspended')),
  contact_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_members (
  org_id uuid not null references public.partner_orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- 1 organization = 1 OAuth app.
create table if not exists public.partner_apps (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.partner_orgs(id) on delete cascade,
  supabase_client_id text unique,
  name text not null,
  description text,
  logo_url text,
  redirect_uris text[] not null default '{}',
  type text not null default 'confidential' check (type in ('public', 'confidential')),
  token_auth_method text default 'client_secret_basic',
  permissions text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per (app, user) authorization. The dashboard's "users" list reads this.
create table if not exists public.partner_consents (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.partner_apps(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  granted_permissions text[] not null default '{}',
  -- Snapshot of the fields the user approved, so partners never read profiles wholesale.
  display_name text,
  username text,
  avatar_url text,
  email text,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_seen_at timestamptz not null default now(),
  unique (app_id, user_id)
);

create table if not exists public.partner_api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.partner_orgs(id) on delete cascade,
  key_id text not null unique,
  label text,
  scopes text[] not null default '{assets:read}',
  rate_limit_per_min int not null default 120,
  status text not null default 'active' check (status in ('active', 'revoked')),
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.partner_requests (
  id uuid primary key default gen_random_uuid(),
  org_name text not null,
  contact_email text not null,
  website text,
  use_case text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.partner_usage_events (
  id bigserial primary key,
  ts timestamptz not null default now(),
  org_id uuid references public.partner_orgs(id) on delete cascade,
  app_id uuid references public.partner_apps(id) on delete cascade,
  key_id text,
  user_id uuid,
  type text not null,
  endpoint text,
  status int,
  latency_ms int
);

create index if not exists partner_usage_events_org_ts_idx on public.partner_usage_events (org_id, ts desc);
create index if not exists partner_consents_app_idx on public.partner_consents (app_id);
create index if not exists partner_api_keys_org_idx on public.partner_api_keys (org_id);

-- Membership check used by every RLS policy. SECURITY DEFINER so it can read
-- partner_members regardless of the caller's own policies.
create or replace function public.is_partner_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.partner_members m
    where m.org_id = target_org and m.user_id = auth.uid()
  );
$$;

alter table public.partner_orgs enable row level security;
alter table public.partner_members enable row level security;
alter table public.partner_apps enable row level security;
alter table public.partner_consents enable row level security;
alter table public.partner_api_keys enable row level security;
alter table public.partner_requests enable row level security;
alter table public.partner_usage_events enable row level security;

-- partner_orgs ---------------------------------------------------------------
drop policy if exists "Partner members read their org" on public.partner_orgs;
create policy "Partner members read their org"
  on public.partner_orgs for select
  using (public.is_partner_member(id));

drop policy if exists "Partner owners update their org" on public.partner_orgs;
create policy "Partner owners update their org"
  on public.partner_orgs for update
  using (exists (
    select 1 from public.partner_members m
    where m.org_id = partner_orgs.id and m.user_id = auth.uid() and m.role = 'owner'
  ));

-- partner_members ------------------------------------------------------------
drop policy if exists "Members read their own membership" on public.partner_members;
create policy "Members read their own membership"
  on public.partner_members for select
  using (user_id = auth.uid() or public.is_partner_member(org_id));

-- partner_apps ---------------------------------------------------------------
drop policy if exists "Partner members read their app" on public.partner_apps;
create policy "Partner members read their app"
  on public.partner_apps for select
  using (public.is_partner_member(org_id));

drop policy if exists "Partner members update their app" on public.partner_apps;
create policy "Partner members update their app"
  on public.partner_apps for update
  using (public.is_partner_member(org_id))
  with check (public.is_partner_member(org_id));

-- partner_api_keys -----------------------------------------------------------
drop policy if exists "Partner members read their keys" on public.partner_api_keys;
create policy "Partner members read their keys"
  on public.partner_api_keys for select
  using (public.is_partner_member(org_id));

-- Key *creation* goes through the partner-keys Edge Function (needs the router admin
-- key), so there is deliberately no insert policy here.

-- partner_consents -----------------------------------------------------------
-- Partners see the users of their own app; users see (and can revoke) their own grants.
drop policy if exists "Partners read their app consents" on public.partner_consents;
create policy "Partners read their app consents"
  on public.partner_consents for select
  using (exists (
    select 1 from public.partner_apps a
    where a.id = partner_consents.app_id and public.is_partner_member(a.org_id)
  ));

drop policy if exists "Users read their own consents" on public.partner_consents;
create policy "Users read their own consents"
  on public.partner_consents for select
  using (user_id = auth.uid());

drop policy if exists "Users revoke their own consents" on public.partner_consents;
create policy "Users revoke their own consents"
  on public.partner_consents for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Partners revoke their app consents" on public.partner_consents;
create policy "Partners revoke their app consents"
  on public.partner_consents for update
  using (exists (
    select 1 from public.partner_apps a
    where a.id = partner_consents.app_id and public.is_partner_member(a.org_id)
  ))
  with check (exists (
    select 1 from public.partner_apps a
    where a.id = partner_consents.app_id and public.is_partner_member(a.org_id)
  ));

-- partner_usage_events -------------------------------------------------------
drop policy if exists "Partner members read their usage" on public.partner_usage_events;
create policy "Partner members read their usage"
  on public.partner_usage_events for select
  using (org_id is not null and public.is_partner_member(org_id));

-- partner_requests -----------------------------------------------------------
-- Anyone (including anonymous visitors) may submit an invite request; only the
-- service role can read the queue.
drop policy if exists "Anyone can request an invite" on public.partner_requests;
create policy "Anyone can request an invite"
  on public.partner_requests for insert
  with check (true);
