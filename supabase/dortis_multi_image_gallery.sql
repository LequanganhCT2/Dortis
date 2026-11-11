-- DORTIS — public media gallery (additive, retains legacy site_images rows).
-- Existing primary images stay in public.site_images and are displayed first.
-- Apply to the Dortis Supabase project only.
begin;

alter table public.site_images drop constraint if exists valid_site_image_slot;
alter table public.site_images add constraint valid_site_image_slot
  check (slot ~ '^(hero|service-(cv|brand|visual|web)|service-gallery-(05|06|07|08|09|10)|project-[a-zA-Z0-9_-]{10,150}|about|contact|artist-experience|values|faq)$');

create table if not exists public.site_image_gallery (
  id uuid primary key default gen_random_uuid(),
  slot text not null check (slot ~ '^(hero|service-(cv|brand|visual|web)|service-gallery-(05|06|07|08|09|10)|project-[a-zA-Z0-9_-]{10,150}|about|contact|artist-experience|values|faq)$'),
  image_url text not null check (image_url ~ '^https://'),
  storage_path text not null unique,
  position integer not null default 0 check (position between 0 and 10000),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists site_image_gallery_order_idx
  on public.site_image_gallery(slot,position,created_at);

alter table public.site_image_gallery enable row level security;
grant select on public.site_image_gallery to anon, authenticated;
grant insert,update,delete on public.site_image_gallery to authenticated;

drop policy if exists dortis_public_read_site_image_gallery on public.site_image_gallery;
create policy dortis_public_read_site_image_gallery on public.site_image_gallery
  for select to anon,authenticated using(true);

drop policy if exists dortis_admin_insert_site_image_gallery on public.site_image_gallery;
create policy dortis_admin_insert_site_image_gallery on public.site_image_gallery
  for insert to authenticated with check(
    (auth.jwt()->'app_metadata'->>'role')='admin' and updated_by=(select auth.uid())
  );

drop policy if exists dortis_admin_update_site_image_gallery on public.site_image_gallery;
create policy dortis_admin_update_site_image_gallery on public.site_image_gallery
  for update to authenticated using((auth.jwt()->'app_metadata'->>'role')='admin')
  with check((auth.jwt()->'app_metadata'->>'role')='admin' and updated_by=(select auth.uid()));

drop policy if exists dortis_admin_delete_site_image_gallery on public.site_image_gallery;
create policy dortis_admin_delete_site_image_gallery on public.site_image_gallery
  for delete to authenticated using((auth.jwt()->'app_metadata'->>'role')='admin');

-- Avoid duplicate publication entries on reruns.
do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime'
      and schemaname='public' and tablename='site_images') then
      alter publication supabase_realtime add table public.site_images;
    end if;
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime'
      and schemaname='public' and tablename='site_image_gallery') then
      alter publication supabase_realtime add table public.site_image_gallery;
    end if;
  end if;
end $$;
commit;
