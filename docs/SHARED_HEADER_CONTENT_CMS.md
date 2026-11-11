# DORTIS — Shared Header and CMS Text Editing

## Shared Header

The original Home Page logo and navigation now live in a single React component:
- \`src/SiteHeader.jsx\` exports \`SiteHeader\` and \`Brand\`.
- \`src/site-header.css\` handles padding for non-home routes.
- \`src/main.jsx\` renders the shared header in Home and \`/admin\` paths.
- \`src/ArtistPages.jsx\` renders the same header on \`/artists\` and \`/artists/:slug\`.
- Home links are \`#section\`; from other routes they're \`/#section\`.
- Mobile menu has an accessible toggle; scroll tracking for active section is isolated to the header.

## Editing words in the image library

1. Open \`/admin\`, sign in with an Admin-privileged account.
2. Choose a zone: Hero, Services, Projects, Artist Experience, Philosophy, Values, FAQ or Contact.
3. Press **Chỉnh nội dung** to expand editor fields for section heading, description, buttons, chapter text, cards and other visible copy.
4. For Services and Projects, each child image slot has its own independent **Chỉnh nội dung** editor.
5. Press **Lưu nội dung**; Supabase updates \`public.site_content\` and the homepage refreshes the text via Realtime without a full-page reload.
6. **Khôi phục mặc định** deletes only that slot's editable override (with confirmation) and returns to original website copy; neither image records nor galleries are touched.

### Technical design

- \`src/siteContent.js\`: static defaults and type-appropriate field definitions mapped to actual JSX; exported \`useSiteContent\` realtime reader and \`copyFor\` fallback.
- \`src/AdminSectionContent.jsx\` and \`src/admin-section-content.css\`: form, error feedback, length limits and Save/Restore.
- \`src/AdminMediaEditor.jsx\`: editors embedded near each image group/slot.
- \`src/CaxHeroCopy.jsx\`, \`src/CaxExperience.jsx\`, \`src/CircularServiceCarousel.jsx\`, \`src/PhilosophyStoryCard.jsx\`, \`src/DortisFAQ.jsx\`, \`src/main.jsx\`: render data-backed content.
- \`supabase/dortis_site_content.sql\`: additive migration with public read and Admin-only write; \`app_metadata.role\` is checked in RLS.

This editor is plain text. It does not allow HTML, JavaScript or rich text injection. Inputs render as React text nodes, never using \`dangerouslySetInnerHTML\`.

Image upload, original artist PDF portfolio workflow and the site's animations remain unchanged.

## Verification

- Supabase \`site_content\` table, RLS policies and realtime publication are verified.
- GitHub Actions build and production Vercel release must be checked on the final commit.
- Browser smoke test should save an Admin text change, open Home in another tab and verify the value updates without navigation or full reload.
