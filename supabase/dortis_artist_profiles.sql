-- Dortis artist profile / each imported PDF creates one artist webpage.
-- The public reads only published, manually approved profiles.
-- Original PDFs are kept in a private bucket, separate from generated public page visuals.
begin;
create table if not exists public.artist_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 100),
  name text not null check(length(trim(name)) between 2 and 160),
  role text not null default 'Nghệ sĩ',
  tagline text not null default '',
  intro text not null default '',
  sections jsonb not null default '[]'::jsonb check(jsonb_typeof(sections)='array'),
  cover_image_url text,
  status text not null default 'draft' check(status in ('draft','published')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artist_cover_https check(cover_image_url is null or cover_image_url ~ '^https://')
);
create index if not exists artist_profiles_status_updated_idx on public.artist_profiles(status,updated_at desc);
alter table public.artist_profiles enable row level security;
grant select on public.artist_profiles to anon,authenticated;
grant insert,update,delete on public.artist_profiles to authenticated;
drop policy if exists artist_profiles_read_public_or_admin on public.artist_profiles;
create policy artist_profiles_read_public_or_admin on public.artist_profiles for select to anon,authenticated
  using(status='published' or ((auth.jwt()->'app_metadata'->>'role')='admin'));
drop policy if exists artist_profiles_admin_insert on public.artist_profiles;
create policy artist_profiles_admin_insert on public.artist_profiles for insert to authenticated
  with check((auth.jwt()->'app_metadata'->>'role')='admin' and created_by=(select auth.uid()));
drop policy if exists artist_profiles_admin_update on public.artist_profiles;
create policy artist_profiles_admin_update on public.artist_profiles for update to authenticated
  using((auth.jwt()->'app_metadata'->>'role')='admin')
  with check((auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists artist_profiles_admin_delete on public.artist_profiles;
create policy artist_profiles_admin_delete on public.artist_profiles for delete to authenticated
  using((auth.jwt()->'app_metadata'->>'role')='admin');

create table if not exists public.artist_profile_sources (
  profile_id uuid primary key references public.artist_profiles(id) on delete cascade,
  original_filename text not null,
  pdf_storage_path text not null,
  page_count integer not null check(page_count between 1 and 100),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.artist_profile_sources enable row level security;
grant select,insert,update,delete on public.artist_profile_sources to authenticated;
drop policy if exists artist_sources_admin_select on public.artist_profile_sources;
create policy artist_sources_admin_select on public.artist_profile_sources for select to authenticated
  using((auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists artist_sources_admin_insert on public.artist_profile_sources;
create policy artist_sources_admin_insert on public.artist_profile_sources for insert to authenticated
  with check((auth.jwt()->'app_metadata'->>'role')='admin' and uploaded_by=(select auth.uid()));
drop policy if exists artist_sources_admin_update on public.artist_profile_sources;
create policy artist_sources_admin_update on public.artist_profile_sources for update to authenticated
  using((auth.jwt()->'app_metadata'->>'role')='admin')
  with check((auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists artist_sources_admin_delete on public.artist_profile_sources;
create policy artist_sources_admin_delete on public.artist_profile_sources for delete to authenticated
  using((auth.jwt()->'app_metadata'->>'role')='admin');

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('dortis-artist-pdfs','dortis-artist-pdfs',false,104857600,array['application/pdf'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,
 allowed_mime_types=excluded.allowed_mime_types;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('dortis-artist-pages','dortis-artist-pages',true,5242880,array['image/webp','image/jpeg'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,
 allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists artist_admin_select_pdf on storage.objects;
create policy artist_admin_select_pdf on storage.objects for select to authenticated
  using(bucket_id='dortis-artist-pdfs' and (auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists artist_admin_upload_pdf on storage.objects;
create policy artist_admin_upload_pdf on storage.objects for insert to authenticated
  with check(bucket_id='dortis-artist-pdfs' and (auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists artist_admin_delete_pdf on storage.objects;
create policy artist_admin_delete_pdf on storage.objects for delete to authenticated
  using(bucket_id='dortis-artist-pdfs' and (auth.jwt()->'app_metadata'->>'role')='admin');

drop policy if exists artist_admin_select_pages on storage.objects;
create policy artist_admin_select_pages on storage.objects for select to authenticated
  using(bucket_id='dortis-artist-pages' and (auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists artist_admin_upload_pages on storage.objects;
create policy artist_admin_upload_pages on storage.objects for insert to authenticated
  with check(bucket_id='dortis-artist-pages' and (auth.jwt()->'app_metadata'->>'role')='admin');
drop policy if exists artist_admin_delete_pages on storage.objects;
create policy artist_admin_delete_pages on storage.objects for delete to authenticated
  using(bucket_id='dortis-artist-pages' and (auth.jwt()->'app_metadata'->>'role')='admin');
commit;