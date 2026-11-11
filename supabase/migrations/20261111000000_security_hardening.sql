-- Security hardening from the 2026-11-11 audit.
--
-- Closes: cross-user writes in storage buckets, drafts readable through a
-- permissive blogs policy, client writes to the shared download counters,
-- anonymous inserts into partner_requests, and mutable search paths on
-- SECURITY DEFINER functions.

-- 1. Storage ----------------------------------------------------------------
-- These policies only checked the bucket, so any authenticated user could
-- write or overwrite any object in `avatars` / `showcase`. The folder-scoped
-- variants below and the existing showcase_user_* policies replace them.
drop policy if exists "Owner can update avatars" on storage.objects;
drop policy if exists "Owner can upload avatars" on storage.objects;
drop policy if exists "Owner can update showcase" on storage.objects;
drop policy if exists "Owner can upload showcase" on storage.objects;
drop policy if exists "Authenticated users can upload creator pack covers" on storage.objects;

create policy "Users insert own avatar folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own avatar folder"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users insert own creator pack cover"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'creator_packs_covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2. Blogs ------------------------------------------------------------------
-- `blogs_public_select` was USING (true) for PUBLIC and ORed with the
-- published-only policies, which made drafts world-readable. Those policies
-- (`blogs_public_read`, `blogs_read_published_or_own`) remain.
drop policy if exists "blogs_public_select" on public.blogs;

-- 3. Download counts --------------------------------------------------------
-- Any signed-in user could insert/update the shared counter rows. Reads stay
-- available to signed-in users; increments now go through one definer RPC.
drop policy if exists "downloads_insert_authenticated" on public.downloads;
drop policy if exists "downloads_update_authenticated" on public.downloads;

create or replace function public.increment_download_count(target_resource_id integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_count integer;
begin
  insert into public.downloads as d (resource_id, count)
  values (target_resource_id, 1)
  on conflict (resource_id)
    do update set count = d.count + 1
  returning d.count into new_count;

  return new_count;
end;
$$;

revoke all on function public.increment_download_count(integer) from public, anon;
grant execute on function public.increment_download_count(integer) to authenticated;

-- 4. Partner invite requests ------------------------------------------------
-- No client code writes this table; the policy only allowed anonymous spam.
drop policy if exists "Anyone can request an invite" on public.partner_requests;

-- 5. Function hardening -----------------------------------------------------
alter function public.set_updated_at() set search_path = '';
alter function public.update_updated_at_column() set search_path = '';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, first_name, last_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from anon, authenticated;

create or replace function public.get_public_profile(user_id uuid)
returns table(id uuid, display_name text, avatar_url text, username text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select p.id, p.display_name, p.avatar_url, p.username
  from public.profiles p
  where p.id = user_id;
end;
$$;
