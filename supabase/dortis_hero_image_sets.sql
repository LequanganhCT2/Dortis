-- Dortis Hero card editor: up to six cards, each with six independent image slots.
-- Compatible with previously uploaded slots hero-set-01..06-card-01..04.
-- The legacy shared Hero photo is migrated to card 01 only.
begin;
alter table public.site_images drop constraint if exists valid_site_image_slot;
alter table public.site_images add constraint valid_site_image_slot
  check (slot ~ '^(hero|hero-set-(0[1-6])-card-(0[1-6])|service-(cv|brand|visual|web)|service-gallery-(05|06|07|08|09|10)|project-[a-zA-Z0-9_-]{10,150}|about|contact|artist-experience|values|faq)$');

insert into public.site_images(slot,image_url,storage_path,updated_by,updated_at)
select 'hero-set-01-card-01', image_url, storage_path, updated_by, now()
from public.site_images where slot='hero' and image_url is not null
on conflict (slot) do update set
  image_url=excluded.image_url,
  storage_path=excluded.storage_path,
  updated_by=excluded.updated_by,
  updated_at=now()
where public.site_images.image_url is null;

-- Keep the file in Storage but retire the legacy shared slot to avoid reappearing
-- as a fallback after an admin removes the new card 01 image.
update public.site_images set image_url=null,storage_path=null,updated_at=now()
where slot='hero' and image_url is not null
  and exists (select 1 from public.site_images
    where slot='hero-set-01-card-01' and image_url is not null);
commit;
