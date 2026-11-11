/**
 * Original image resolver for published PDF pages or local Admin previews.
 * HTTPS URLs are stored publicly only after approved publication;
 * blob: URLs are temporary in-browser previews and are never persisted.
 */
export function getOriginalPageUrl(section) {
  const url=section?.original_page_url||section?.image_url
  return typeof url==='string' && /^(https:\/\/|blob:)/i.test(url)?url:null
}
export function hasOriginalPages(sections) {
  return Array.isArray(sections)&&sections.length>0&&sections.every(section=>getOriginalPageUrl(section))
}
export function defaultArtistDisplayMode(profile,sections) {
  return profile?.render_mode==='editorial'?'editorial':
    hasOriginalPages(sections)?'original':'editorial'
}
