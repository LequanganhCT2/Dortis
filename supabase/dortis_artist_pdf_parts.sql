-- Allow private byte-for-byte PDF parts in Dortis' existing private bucket.
-- Project-wide limit (Free <= 50 MB/object) still applies: the importer uploads
-- each part as its own 4 MiB object and stores a manifest in artist_profile_sources.
-- Nothing is made public; existing PDF originals and policies remain unchanged.
update storage.buckets
set allowed_mime_types = array['application/pdf','application/octet-stream']
where id = 'dortis-artist-pdfs';
