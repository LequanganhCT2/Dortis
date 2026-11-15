export const ROUTES = Object.freeze({
  home: '/',
  admin: '/admin',
  media: '/admin/media',
  artists: '/admin/artists',
  portfolio: '/admin/portfolio',
  publicArtists: '/artists',
  longNhatPublic: '/portfolio/long-nhat'
})

export function resolveRoute(pathname = '/') {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === ROUTES.home || path === '/index.html') return 'home'
  if (path === ROUTES.admin || path.startsWith(ROUTES.admin + '/')) return 'admin'
  if (path === ROUTES.publicArtists || path.startsWith(ROUTES.publicArtists + '/')) return 'artists'
  if (path === ROUTES.longNhatPublic) return 'portfolio-unpublished'
  return 'not-found'
}

export function resolveAdminView(pathname = ROUTES.admin) {
  if (pathname === ROUTES.portfolio) return 'portfolio'
  if (pathname === ROUTES.artists) return 'artists'
  if (pathname === ROUTES.media) return 'media'
  return 'overview'
}
