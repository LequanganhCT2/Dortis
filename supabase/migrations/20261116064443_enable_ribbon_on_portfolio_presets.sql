with targets(slug, section_id) as (
  values ('editorial-story', 'moments'),
         ('cinematic-stage', 'live'),
         ('minimal-signature', 'portfolio')
)
update public.artist_website_templates as templates
set blueprint = jsonb_set(templates.blueprint, '{sections}', (
      select jsonb_agg(
        case when section->>'id' = targets.section_id
          then jsonb_set(section, '{effect}', '"ribbon"'::jsonb)
          else section
        end order by ordinal
      )
      from jsonb_array_elements(templates.blueprint->'sections') with ordinality
        as sections(section, ordinal)
    )),
    version = templates.version + 1,
    updated_at = now()
from targets
where templates.slug = targets.slug
  and exists (
    select 1 from jsonb_array_elements(templates.blueprint->'sections') as sections(section)
    where section->>'id' = targets.section_id and section->>'effect' is distinct from 'ribbon'
  );
