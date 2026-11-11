# DORTIS — Artist profiles imported from PDF

## Routes

- Public artist index: \`/artists\`
- Public artist portfolio: \`/artists/<slug>\`
- Admin singer PDF manager: \`/admin/artists\`
- Old image manager stays at \`/admin\`.

## Workflow

1. Admin logs into \`/admin\`, chooses **Hồ sơ ca sĩ (PDF)**.
2. Choose 1–8 PDFs in the same upload; **one PDF equals one artist** (each PDF page becomes a CSS-styled chapter on that artist's page).
3. Browser PDF.js reads selectable text and page boundaries. PDFs with image-only pages are flagged; no OCR is performed.
4. Each PDF is stored in the **private** \`dortis-artist-pdfs\` bucket. Extracted sections are stored as a **draft** in \`artist_profiles\`; metadata/path of PDF is in admin-only \`artist_profile_sources\`.
5. Admin can edit name, role, permalink, introduction, headings and text for every extracted page.
6. Press **Xuất bản hồ sơ** only after content and rights review. Browser renders the original PDF pages to WebP/JPEG visual assets, uploads them to the public \`dortis-artist-pages\` bucket and publishes the extracted HTML/CSS content.
7. Press **Chuyển về bản nháp** to make the page disappear from public listing and remove the generated public page assets. Delete removes data, original PDF and visual assets.

## Design

- Public list cards: responsive 1/2/3-column grid.
- Detail: editorial hero with first-page cover; page-by-page sections alternating illustration/text columns, with Be Vietnam Pro + Noto Serif.
- Page art is a visual reference. Text below is editable extracted text, not simply an embedded PDF viewer.
- No fabricated information is inserted into the profile. Empty/unselectable-text pages are displayed with their visual page image.
- Each profile is published independently; one portfolio PDF does not create one artist *per PDF page*.

## Security

- Public RLS reads published artist profiles only; draft profiles require \`app_metadata.role=admin\`.
- Private PDFs and source filename/path are admin-only in Storage and database.
- Public artwork images become accessible after publication, even if the original PDF is private.
- Do not publish until photos, lyrics, contact numbers and identifiable information have been reviewed and authorized.
- Never add private keys, PDFs or passwords to the repository.

## Technical constraints

- Large PDF upload: Supabase TUS resumable 6 MB chunks via pinned `tus-js-client@4.3.1` (files above 6 MB); normal upload for smaller files.
- PDF parser: pinned \`pdfjs-dist@6.5.438\`, loaded only when importing or rendering pages.
- Up to 60 pages and 100 MB per PDF in the browser. Supabase project's global maximum upload size may be lower; a larger document can be compressed first.
- Image extraction: rendered PDF pages, max 1160px width, preferred WebP at 0.77 quality, fallback JPEG, 5MB max per generated page.
- PDF text extraction does **not** support OCR. Scanned/image-only pages need manual transcript if the body text should be searchable.
- Full fidelity of arbitrary PDF typography/layout is not guaranteed; chapter layout is styled HTML/CSS and page snapshots preserve original visual composition.

## Verification

GitHub Actions runs Vite build on push. Supabase migration in \`supabase/dortis_artist_profiles.sql\` has been applied to the Dortis project. Check importing and publishing a sample PDF with admin session manually.
