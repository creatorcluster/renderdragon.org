-- Lets a signed-in user list the partner apps they've connected and revoke them.
-- SECURITY DEFINER so the join to partner_apps (which is RLS-restricted to partner
-- members) can still return the app name/logo for the user's own consents.

create or replace function public.get_my_connected_apps()
returns table (
  consent_id uuid,
  app_id uuid,
  app_name text,
  app_logo text,
  granted_permissions text[],
  granted_at timestamptz,
  revoked_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, a.id, a.name, a.logo_url, c.granted_permissions, c.granted_at, c.revoked_at
  from public.partner_consents c
  join public.partner_apps a on a.id = c.app_id
  where c.user_id = auth.uid()
  order by c.granted_at desc;
$$;

grant execute on function public.get_my_connected_apps() to authenticated;
