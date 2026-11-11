-- Dortis Hero: 4 independent cards, each with 6 ordered image slots.
-- This retains the existing slot pattern and every previously uploaded photo.
-- Existing uploaded photos under hero-set-XX-card-YY map to image XX of card YY.
-- Apply to Dortis Supabase project whkqdusoowrrhtvejrie only.
begin;
alter table public.site_images drop constraint if exists valid_site_image_slot;
alter table public.site_images add constraint valid_site_image_slot
check (slot ~ '^(hero|hero-set-(0[1-6])-card-(0[1-4])|service-(cv|brand|visual|web)|service-gallery-(05|06|07|08|09|10)|project-[a-zA-Z0-9_-]{10,150}|about|contact|artist-experience|values|faq)$');

-- Preserve the old shared Hero image as image 01 on card 01, if that slot is empty.
insert into public.site_images(slot,image_url,storage_path,updated_by,updated_at)
select 'hero-set-01-card-01',image_url,storage_path,updated_by,now()
from public.site_images
where slot='hero' and image_url is not null
on conflict(slot) do nothing;

-- Stop the obsolete shared slot from being reused or deleting the photo.
-- Only clear it when the new card 01 photo actually exists.
update public.site_images set image_url=null,storage_path=null,updated_at=now()
where slot='hero' and image_url is not null
and exists (
  select 1 from public.site_images photo
  where photo.slot='hero-set-01-card-01' and photo.image_url is not null
);
commit;
