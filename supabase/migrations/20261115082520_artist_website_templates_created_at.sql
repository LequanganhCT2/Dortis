-- Fix for the existing DORTIS Production database, 2026-11-15.
-- The Admin form library orders rows by created_at. Earlier schema releases
-- omitted this column although the client expected it.
alter table public.artist_website_templates
  add column if not exists created_at timestamptz not null default now();

create index if not exists artist_website_templates_created_at_idx
  on public.artist_website_templates(created_at asc, id asc);

notify pgrst, 'reload schema';
