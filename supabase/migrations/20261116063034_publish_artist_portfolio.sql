create or replace function public.publish_artist_portfolio(
  p_instance_id uuid,
  p_revision integer,
  p_content jsonb,
  p_snapshot jsonb,
  p_image_paths text[]
)
returns public.artist_website_instances
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved public.artist_website_instances;
begin
  if coalesce(auth.jwt()->'app_metadata'->>'role', '') <> 'admin' then
    raise exception 'Admin role required' using errcode = '42501';
  end if;

  update public.artist_website_instances
  set content = p_content,
      updated_by = auth.uid(),
      updated_at = now(),
      revision = revision + 1
  where id = p_instance_id and revision = p_revision
  returning * into saved;

  if not found then
    raise sqlstate 'PT409' using message = 'Bản nháp đã thay đổi. Hãy mở lại portfolio.';
  end if;

  insert into public.artist_portfolio_publications(instance_id, snapshot, image_paths, published_at)
  values (p_instance_id, p_snapshot, p_image_paths, now())
  on conflict (instance_id) do update set
    snapshot = excluded.snapshot,
    image_paths = excluded.image_paths,
    published_at = excluded.published_at;

  return saved;
end;
$$;

revoke execute on function public.publish_artist_portfolio(uuid, integer, jsonb, jsonb, text[])
  from public, anon;
grant execute on function public.publish_artist_portfolio(uuid, integer, jsonb, jsonb, text[])
  to authenticated;
