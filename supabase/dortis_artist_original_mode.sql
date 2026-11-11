-- DORTIS: use original PDF composition by default for artist portfolios.
-- Existing published legacy page images are reused.
alter table public.artist_profiles
  add column if not exists render_mode text not null default 'original'
  check (render_mode in ('original','editorial'));
comment on column public.artist_profiles.render_mode
  is 'original: PDF-faithful page images; editorial: HTML/CSS sections';
