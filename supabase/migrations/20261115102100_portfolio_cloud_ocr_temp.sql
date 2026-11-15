-- Dortis: temporary private files for explicitly consented external OCR.
-- Browser uploads directly (no Vercel request body limit); API signs a
-- 10-minute read URL, calls Mistral, and deletes the object in finally.
-- Local OCR never touches this bucket. Previous artist PDF storage unchanged.
begin;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('dortis-ocr-temp','dortis-ocr-temp',false,52428800,array['application/pdf'])
on conflict(id) do update
  set public=false,
      file_size_limit=excluded.file_size_limit,
      allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists dortis_ocr_temp_admin_insert on storage.objects;
create policy dortis_ocr_temp_admin_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id='dortis-ocr-temp'
    and (auth.jwt()->'app_metadata'->>'role')='admin'
    and (storage.foldername(name))[1]=(select auth.uid())::text
    and name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}[.]pdf$'
  );

drop policy if exists dortis_ocr_temp_admin_select on storage.objects;
create policy dortis_ocr_temp_admin_select on storage.objects
  for select to authenticated
  using (
    bucket_id='dortis-ocr-temp'
    and (auth.jwt()->'app_metadata'->>'role')='admin'
    and (storage.foldername(name))[1]=(select auth.uid())::text
  );

drop policy if exists dortis_ocr_temp_admin_delete on storage.objects;
create policy dortis_ocr_temp_admin_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id='dortis-ocr-temp'
    and (auth.jwt()->'app_metadata'->>'role')='admin'
    and (storage.foldername(name))[1]=(select auth.uid())::text
  );

commit;
