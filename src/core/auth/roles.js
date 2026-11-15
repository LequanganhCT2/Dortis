/** Public browsing is anonymous; signing in never implies editing rights. */
export const ROLES = Object.freeze({ ADMIN: 'admin', GUEST: 'guest' })
export function roleFromUser(user) {
  return user?.app_metadata?.role === ROLES.ADMIN ? ROLES.ADMIN : ROLES.GUEST
}
export function canManageContent(user) {
  return Boolean(user?.id) && roleFromUser(user) === ROLES.ADMIN
}
export function mayViewPublishedContent() { return true }
