-- Dortis Hero: up to six independent image sets, each holding four public cards.
-- Safe for existing data; preserves all previously allowed media slots and RLS policies.
-- Apply to Supabase project whkqdusoowrrhtvejrie before deploying the new editor.
begin;
alter table public.site_images drop constraint if exists valid_site_image_slot;
alter table public.site_images add constraint valid_site_image_slot
check (slot ~ '^(hero|hero-set-(0[1-6])-card-(0[1-4])|service-(cv|brand|visual|web)|service-gallery-(05|06|07|08|09|10)|project-[a-zA-Z0-9_-]{10,150}|about|contact|artist-experience|values|faq)$');
commit;
