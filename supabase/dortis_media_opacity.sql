-- Dortis / optional, per-image opacity metadata.
-- Null uses the original section appearance; 0 means invisible; 100 means fully visible.
-- Keeps existing media, Storage files, and RLS policies unchanged.
begin;
alter table public.site_images
  add column if not exists opacity_percent smallint
    constraint site_images_opacity_percent_valid
    check (opacity_percent between 0 and 100);
alter table public.site_image_gallery
  add column if not exists opacity_percent smallint
    constraint site_image_gallery_opacity_percent_valid
    check (opacity_percent between 0 and 100);
commit;
