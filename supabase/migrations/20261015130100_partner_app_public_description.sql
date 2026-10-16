-- Include the app description in the public consent lookup so the consent screen can
-- show what the app does (see docs/partner-program/oauth-consent.md).

drop function if exists public.partner_app_public(text);

create or replace function public.partner_app_public(p_client_id text)
returns table (id uuid, name text, description text, logo_url text, permissions text[])
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.name, a.description, a.logo_url, a.permissions
  from public.partner_apps a
  where a.supabase_client_id = p_client_id
    and a.status = 'active'
  limit 1;
$$;

grant execute on function public.partner_app_public(text) to anon, authenticated;
