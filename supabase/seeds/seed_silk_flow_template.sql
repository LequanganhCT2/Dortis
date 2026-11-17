-- Template 02: copy the CURRENT Silk Atelier blueprint, not a stale
-- hardcoded copy of its eight sections. No updates to Template 01 or artists.
-- Safe to rerun: does not overwrite later Admin edits to Silk Flow.
insert into public.artist_website_templates
  (slug,name,description,blueprint,status,version)
select
  'silk-flow',
  'Dortis Silk Flow',
  'Template 02 · Lụa xanh bán trong suốt nhiều lớp trên nền trắng. Kế thừa 8 khu vực, ảnh và công cụ chỉnh sửa của Silk Atelier.',
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(t.blueprint,
          '{visualTheme}',to_jsonb('silk-flow'::text),true),
        '{colorPalette}',to_jsonb('ice-blue'::text),true),
      '{glowOpacity}','0.12'::jsonb,true),
    '{source}',to_jsonb('DORTIS_SILK_FLOW_V1'::text),true),
  'active',1
from public.artist_website_templates t
where t.slug='silk-atelier'
on conflict (slug) do nothing;
