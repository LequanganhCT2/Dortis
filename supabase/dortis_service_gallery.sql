-- Add six optional service-gallery image slots for the circular Dortis services carousel.
-- This retains all previous slots and the existing admin-only RLS policies.
alter table public.site_images drop constraint if exists valid_site_image_slot;
alter table public.site_images add constraint valid_site_image_slot
  check (slot ~ '^(hero|service-(cv|brand|visual|web)|service-gallery-(05|06|07|08|09|10)|project-[a-zA-Z0-9_-]{10,150}|about|contact)$');
