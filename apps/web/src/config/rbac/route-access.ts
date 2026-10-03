/**
 * Route-level permission gate.
 *
 * Single source of truth: `NAV_CATALOG` in `./nav-items`. Every nav item
 * declares the feature path it grants access to (via `resolveFeaturePath`)
 * and the permission codes required to view it. The sidebar uses the same
 * catalog for *visibility*; this module reuses it for *enforcement*, so the
 * two can never drift apart.
 *
 * Rules:
 *   1. A role's own landing path is always allowed (AGENTS.md §5). Without
 *      this rule a landing like TRANSPORTEUR → `/transporters` would loop,
 *      because the `transporters` nav item requires `transporters.read`,
 *      which TRANSPORTEUR does not hold.
 *   2. Chrome-reachable pages (user menu, landing, header) are open to every
 *      authenticated role, even when a nav item also declares their path.
 *      The `settings` nav item (requires `settings.read`, SUPERADMIN-only)
 *      and the per-role `/settings` hub share a path: the sidebar gates the
 *      *entry's visibility*; the route stays open. (Catalog collision to
 *      reconcile in plan Milestone 0.)
 *   3. Any other path declared by a nav item is allowed only if the role
 *      holds at least one of its required codes.
 *   4. Paths with no nav declaration (e.g. `/tour-tracking` before the catalog refresh,
 *      `/dashboard`) are reachable only via app chrome (header, landing) and
 *      are left open — declare a nav item to start gating one.
 */
import { hasPermission, type PermissionCode, type Role } from '@lpg/permissions'
import { NAV_CATALOG, resolveFeaturePath } from './nav-items'
import { landingPathFor } from './sidebar-by-role'

interface NavPathEntry {
  path: string
  requires: readonly PermissionCode[]
}

/** Enumerate every declared feature path once, keyed by its resolved URL. */
const PATH_ENTRIES: NavPathEntry[] = NAV_CATALOG.map((item) => ({
  path: resolveFeaturePath(item),
  requires: item.requires,
}))

/**
 * Routes reachable from app chrome (user menu, header, role landing) by every
 * authenticated role, regardless of any nav declaration. Kept in sync with
 * `components/layout/nav-user.tsx` and the `/settings` role hub.
 *
 * NOTE: `/settings/notification-groups` is intentionally NOT here — it is a
 * full CRUD editor and is gated by `notification-groups.write` via its nav
 * declaration (see `nav-items.ts`).
 */
const CHROME_PATHS: readonly string[] = [
  '/settings',
  '/settings/profile',
]

function normalizePath(pathname: string): string {
  const withoutQuery = pathname.split('?')[0] ?? ''
  const withoutHash = withoutQuery.split('#')[0] ?? ''
  return withoutHash.replace(/\/+$/, '') || '/'
}

/**
 * True when the active role may navigate to `pathname`.
 * Pure && data-driven — never reason about grants by hand in components.
 */
export function canAccessPath(role: Role, pathname: string): boolean {
  const path = normalizePath(pathname)

  // 1. Landing is always reachable for the role (prevents redirect loops).
  const landing = landingPathFor(role)
  if (path === landing) return true

  // 2. Chrome-reachable pages are open to all authenticated roles.
  if (CHROME_PATHS.includes(path)) return true

  // 3. Declared feature paths: authorize against their required codes.
  const declared = PATH_ENTRIES.filter(
    (entry) => path === entry.path || path.startsWith(`${entry.path}/`),
  )
  if (declared.length > 0) {
    return declared.some((entry) =>
      entry.requires.some((code) => hasPermission(role, code)),
    )
  }

  // 4. No declared nav item covers this path → auxiliary route, open by design.
  return true
}

/**
 * Landing to redirect to when a route is denied. Never returns a path that
 * would loop (it returns the role's own landing, which rule 1 always allows).
 */
export function deniedPathRedirect(role: Role, pathname: string): string | null {
  return canAccessPath(role, pathname) ? null : landingPathFor(role)
}