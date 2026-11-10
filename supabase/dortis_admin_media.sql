-- Dortis: admin-managed homepage images.
-- Execute in SQL Editor of SUPABASE PROJECT whkqdusoowrrhtvejrie ONLY.
-- Never expose a service_role key or store an admin password in the public website.

create table if not exists public.site_images (
  slot text primary key,
  image_url text,
  storage_path text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint valid_site_image_slot check (slot ~ '^(hero|service-(cv|brand|visual|web)|project-[a-zA-Z0-9_-]{10,150}|about|contact)$'),
  constraint valid_public_image_url check (image_url is null or image_url ~ '^https://')
);
alter table public.site_images enable row level security;
grant select on public.site_images to anon, authenticated;
grant insert, update, delete on public.site_images to authenticated;

drop policy if exists "dortis_public_view_site_images" on public.site_images;
create policy "dortis_public_view_site_images" on public.site_images
for select to anon, authenticated using (true);

-- Roles are granted by the Supabase project owner in auth.users.raw_app_meta_data.
-- Do not trust user_metadata because the user can edit it.
drop policy if exists "dortis_admin_insert_site_images" on public.site_images;
create policy "dortis_admin_insert_site_images" on public.site_images
for insert to authenticated
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  and updated_by = (select auth.uid()));

drop policy if exists "dortis_admin_update_site_images" on public.site_images;
create policy "dortis_admin_update_site_images" on public.site_images
for update to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  and updated_by = (select auth.uid()));

drop policy if exists "dortis_admin_delete_site_images" on public.site_images;
create policy "dortis_admin_delete_site_images" on public.site_images
for delete to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Public bucket for public website assets. Uploading/removing is admin-only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dortis-media','dortis-media',true,5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update
set public = true, file_size_limit = excluded.file_size_limit,
allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "dortis_admin_select_media" on storage.objects;
create policy "dortis_admin_select_media" on storage.objects
for select to authenticated
using (bucket_id = 'dortis-media'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "dortis_admin_upload_media" on storage.objects;
create policy "dortis_admin_upload_media" on storage.objects
for insert to authenticated
with check (bucket_id = 'dortis-media'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "dortis_admin_update_media" on storage.objects;
create policy "dortis_admin_update_media" on storage.objects
for update to authenticated
using (bucket_id = 'dortis-media'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check (bucket_id = 'dortis-media'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "dortis_admin_delete_media" on storage.objects;
create policy "dortis_admin_delete_media" on storage.objects
for delete to authenticated
using (bucket_id = 'dortis-media'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Use the Supabase dashboard > Authentication > Users to create an email/password
-- user; then set its app_metadata role to admin with THIS statement after
-- replacing the placeholder with the same email (do not commit the actual email).
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
-- where email = '<YOUR_ADMIN_EMAIL>';
-- The user must sign out and back in after their admin role is granted.

-- Optional verification after setup:
-- select slot,image_url,updated_at from public.site_images order by slot;
