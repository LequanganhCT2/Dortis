export const ROUTES = Object.freeze({
  home: '/',
  login: '/login',
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
  if (path === ROUTES.login) return 'login'
  if (path === ROUTES.admin || path.startsWith(ROUTES.admin + '/')) return 'admin'
  if (path === ROUTES.publicArtists || path.startsWith(ROUTES.publicArtists + '/')) return 'artists'
  if (path === ROUTES.longNhatPublic) return 'portfolio-unpublished'
  return 'not-found'
}

export function resolveAdminView(pathname = ROUTES.admin) {
  // Legacy Portfolio link now opens the unified artist library.
  if (pathname === ROUTES.portfolio) return 'artists'
  if (pathname === ROUTES.artists) return 'artists'
  if (pathname === ROUTES.media) return 'media'
  return 'overview'
}

/** Shared auth transition policy (actual writes remain protected by Supabase RLS). */
export function authRedirect(mode,checking,authorized){
  if(checking)return null
  if(mode==='admin'&&!authorized)return ROUTES.login
  if(mode==='login'&&authorized)return ROUTES.admin
  return null
}
