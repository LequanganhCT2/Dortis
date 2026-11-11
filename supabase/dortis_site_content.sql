-- DORTIS: editable homepage section copy in the existing image library Admin.
-- Migrated to Dortis Supabase on 2026-11-11. Additive: existing images are unchanged.
begin;
create table if not exists public.site_content (
  key text primary key check (key ~ '^(hero|services|projects|artist-experience|about|values|faq|contact|service-(cv|brand|visual|web)|service-gallery-(05|06|07|08|09|10)|project-approved-(01|02|03))$'),
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content)='object' and length(content::text)<30000),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
grant select on public.site_content to anon,authenticated;
grant insert,update,delete on public.site_content to authenticated;
drop policy if exists dortis_read_site_content on public.site_content;
create policy dortis_read_site_content on public.site_content
  for select to anon,authenticated using(true);
drop policy if exists dortis_admin_insert_site_content on public.site_content;
create policy dortis_admin_insert_site_content on public.site_content
  for insert to authenticated with check (
    (auth.jwt()->'app_metadata'->>'role')='admin' and updated_by=(select auth.uid())
  );
drop policy if exists dortis_admin_update_site_content on public.site_content;
create policy dortis_admin_update_site_content on public.site_content
  for update to authenticated using ((auth.jwt()->'app_metadata'->>'role')='admin')
  with check ((auth.jwt()->'app_metadata'->>'role')='admin' and updated_by=(select auth.uid()));
drop policy if exists dortis_admin_delete_site_content on public.site_content;
create policy dortis_admin_delete_site_content on public.site_content
  for delete to authenticated using ((auth.jwt()->'app_metadata'->>'role')='admin');
do $$
begin
  if not exists (select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='site_content') then
    alter publication supabase_realtime add table public.site_content;
  end if;
end $$;
commit;
