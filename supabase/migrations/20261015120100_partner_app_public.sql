-- Partner Program follow-ups:
--  * a public lookup so the consent screen (any signed-in user) can show an app's
--    name, logo and the exact permissions it requested, keyed by OAuth client_id;
--  * an insert policy so a user can record their own consent grant.

create or replace function public.partner_app_public(p_client_id text)
returns table (id uuid, name text, logo_url text, permissions text[])
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.name, a.logo_url, a.permissions
  from public.partner_apps a
  where a.supabase_client_id = p_client_id
    and a.status = 'active'
  limit 1;
$$;

grant execute on function public.partner_app_public(text) to anon, authenticated;

-- Users may create their own consent grant (e.g. from the consent screen).
drop policy if exists "Users record their own consents" on public.partner_consents;
create policy "Users record their own consents"
  on public.partner_consents for insert
  with check (user_id = auth.uid());
