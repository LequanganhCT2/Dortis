-- Safe replace: retire old presets in the Admin catalog without deleting their
-- instances, uploaded assets or already-published portfolio links.
-- New shared Form is created only once; reruns never overwrite Admin edits.
begin;
insert into public.artist_website_templates
  (slug,name,description,blueprint,status,version)
values (
  'silk-atelier','Dortis Silk Atelier',
  'Một Form nghệ thuật với lụa đỏ vàng liền mạch và ánh sáng trong suốt phủ trên cùng.',
  '{"style":"editorial","visualTheme":"ribbon-luxury","ribbonLayout":"diagonal","ribbonDirection":"down-right","glowOpacity":0.28,"source":"DORTIS_SILK_ATELIER_V1","approval":"PROPOSED","sections":[{"id":"hero","label":"01 · Chân dung nghệ sĩ","layout":"cover","effect":"auto","slots":1},{"id":"story","label":"02 · Câu chuyện nghệ thuật","layout":"split-reverse","effect":"auto","slots":1},{"id":"journey","label":"03 · Hành trình & dấu ấn","layout":"split","effect":"auto","slots":1},{"id":"skills","label":"04 · Thế mạnh / Phong cách","layout":"text","effect":"auto","slots":0},{"id":"achievements","label":"05 · Thành tựu","layout":"grid","effect":"auto","slots":3},{"id":"performance","label":"06 · Khoảnh khắc biểu diễn","layout":"mosaic","effect":"auto","slots":4},{"id":"gallery","label":"07 · Thư viện nghệ thuật","layout":"grid","effect":"auto","slots":6},{"id":"contact","label":"08 · Liên hệ & Booking","layout":"text","effect":"auto","slots":0}]}'::jsonb,
  'active',1
)
on conflict (slug) do nothing;

-- Keep legacy templates available for existing published URLs, but hide them
-- from new artist assignments and the Admin selectable catalog.
update public.artist_website_templates
set status='archived',updated_at=now()
where slug<>'silk-atelier' and status<>'archived';

-- Populate a fresh draft from the previously reviewed La Trinh profile.
-- Do not copy legacy uploaded image paths or claim automatic extraction of photos.
insert into public.artist_website_instances
 (template_id,profile_id,content,status)
select t.id,p.id,
  jsonb_build_object(
    'sections',jsonb_build_object(
       'hero',jsonb_build_object('sourcePage',1),
       'story',jsonb_build_object('sourcePage',2),
       'journey',jsonb_build_object('sourcePage',3),
       'skills',jsonb_build_object('sourcePage',4),
       'achievements',jsonb_build_object('sourcePage',5),
       'performance',jsonb_build_object('sourcePage',6),
       'gallery',jsonb_build_object('sourcePage',7),
       'contact',jsonb_build_object('sourcePage',11)
    ),
    'images','{}'::jsonb
  ),
  'draft'
from public.artist_website_templates t
join public.artist_profiles p on p.slug='la-trinh'
where t.slug='silk-atelier'
  and not exists (
    select 1 from public.artist_website_instances i
    where i.template_id=t.id and i.profile_id=p.id
  );

commit;
