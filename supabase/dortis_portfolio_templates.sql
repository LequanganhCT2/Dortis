-- DORTIS reusable Portfolio form inheritance schema.
-- Apply in Supabase SQL Editor in existing project when setting up from scratch.
-- Form => many artist instances; layout inherited, content/photo assets isolated.
create table if not exists public.artist_website_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,60}$'),
  name text not null check(length(trim(name)) between 3 and 120),
  description text not null default '',
  blueprint jsonb not null default '{}'::jsonb check(jsonb_typeof(blueprint)='object'),
  version integer not null default 1 check(version>=1),
  status text not null default 'active' check(status in ('active','archived')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Existing projects may already have the table from a previous migration.
alter table public.artist_website_templates
  add column if not exists created_at timestamptz not null default now();
create index if not exists artist_website_templates_created_at_idx
  on public.artist_website_templates(created_at asc, id asc);

create table if not exists public.artist_website_instances (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.artist_website_templates(id) on delete restrict,
  profile_id uuid not null references public.artist_profiles(id) on delete cascade,
  content jsonb not null default '{}'::jsonb check(jsonb_typeof(content)='object'),
  status text not null default 'draft' check(status in ('draft','review')),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  revision integer not null default 1 check(revision >= 1),
  unique(template_id,profile_id)
);
alter table public.artist_website_instances
  add column if not exists revision integer not null default 1 check(revision>=1);
create index if not exists artist_web_instances_template_idx on public.artist_website_instances(template_id);
create index if not exists artist_web_instances_profile_idx on public.artist_website_instances(profile_id);
alter table public.artist_website_templates enable row level security;
alter table public.artist_website_instances enable row level security;
revoke all on public.artist_website_templates from anon;
revoke all on public.artist_website_instances from anon;
grant select,insert,update,delete on public.artist_website_templates to authenticated;
grant select,insert,update,delete on public.artist_website_instances to authenticated;

drop policy if exists artist_templates_admin_select on public.artist_website_templates;
create policy artist_templates_admin_select on public.artist_website_templates for select to authenticated
using (((select auth.jwt())->'app_metadata'->>'role')='admin');
drop policy if exists artist_templates_admin_insert on public.artist_website_templates;
create policy artist_templates_admin_insert on public.artist_website_templates for insert to authenticated
with check (((select auth.jwt())->'app_metadata'->>'role')='admin' and created_by=(select auth.uid()));
drop policy if exists artist_templates_admin_update on public.artist_website_templates;
create policy artist_templates_admin_update on public.artist_website_templates for update to authenticated
using (((select auth.jwt())->'app_metadata'->>'role')='admin')
with check (((select auth.jwt())->'app_metadata'->>'role')='admin');
drop policy if exists artist_templates_admin_delete on public.artist_website_templates;
create policy artist_templates_admin_delete on public.artist_website_templates for delete to authenticated
using (((select auth.jwt())->'app_metadata'->>'role')='admin');

drop policy if exists artist_instances_admin_select on public.artist_website_instances;
create policy artist_instances_admin_select on public.artist_website_instances for select to authenticated
using (((select auth.jwt())->'app_metadata'->>'role')='admin');
drop policy if exists artist_instances_admin_insert on public.artist_website_instances;
create policy artist_instances_admin_insert on public.artist_website_instances for insert to authenticated
with check (((select auth.jwt())->'app_metadata'->>'role')='admin' and updated_by=(select auth.uid()));
drop policy if exists artist_instances_admin_update on public.artist_website_instances;
create policy artist_instances_admin_update on public.artist_website_instances for update to authenticated
using (((select auth.jwt())->'app_metadata'->>'role')='admin')
with check (((select auth.jwt())->'app_metadata'->>'role')='admin' and updated_by=(select auth.uid()));
drop policy if exists artist_instances_admin_delete on public.artist_website_instances;
create policy artist_instances_admin_delete on public.artist_website_instances for delete to authenticated
using (((select auth.jwt())->'app_metadata'->>'role')='admin');

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('dortis-artist-web-drafts','dortis-artist-web-drafts',false,4194304,
array['image/jpeg','image/png','image/webp','image/avif'])
on conflict(id) do update set public=false,file_size_limit=4194304,
allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists artist_web_draft_select on storage.objects;
create policy artist_web_draft_select on storage.objects for select to authenticated
using (bucket_id='dortis-artist-web-drafts' and ((select auth.jwt())->'app_metadata'->>'role')='admin');
drop policy if exists artist_web_draft_insert on storage.objects;
create policy artist_web_draft_insert on storage.objects for insert to authenticated
with check(bucket_id='dortis-artist-web-drafts' and ((select auth.jwt())->'app_metadata'->>'role')='admin');
drop policy if exists artist_web_draft_delete on storage.objects;
create policy artist_web_draft_delete on storage.objects for delete to authenticated
using(bucket_id='dortis-artist-web-drafts' and ((select auth.jwt())->'app_metadata'->>'role')='admin');

-- Initial preset blueprints are populated separately in the seed migration
-- (see application model PRESET_FORMS); do not import PDF images into any instance.
