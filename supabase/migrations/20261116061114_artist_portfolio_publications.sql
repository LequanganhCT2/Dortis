create table public.artist_portfolio_publications (
  instance_id uuid primary key references public.artist_website_instances(id) on delete cascade,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  image_paths text[] not null default '{}',
  published_at timestamptz not null default now()
);

alter table public.artist_portfolio_publications enable row level security;
revoke all on public.artist_portfolio_publications from anon, authenticated;
grant select on public.artist_portfolio_publications to anon, authenticated;
grant insert, update on public.artist_portfolio_publications to authenticated;

create policy artist_publications_read on public.artist_portfolio_publications
  for select to anon, authenticated using (true);
create policy artist_publications_admin_insert on public.artist_portfolio_publications
  for insert to authenticated
  with check (((select auth.jwt())->'app_metadata'->>'role') = 'admin');
create policy artist_publications_admin_update on public.artist_portfolio_publications
  for update to authenticated
  using (((select auth.jwt())->'app_metadata'->>'role') = 'admin')
  with check (((select auth.jwt())->'app_metadata'->>'role') = 'admin');

create index artist_portfolio_publication_images_idx
  on public.artist_portfolio_publications using gin (image_paths);

create policy artist_web_published_image_read on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'dortis-artist-web-drafts' and exists (
      select 1 from public.artist_portfolio_publications
      where image_paths @> array[storage.objects.name]
    )
  );

create policy artist_web_protect_published_image on storage.objects
  as restrictive for delete to authenticated
  using (
    bucket_id <> 'dortis-artist-web-drafts' or not exists (
      select 1 from public.artist_portfolio_publications
      where image_paths @> array[storage.objects.name]
    )
  );
