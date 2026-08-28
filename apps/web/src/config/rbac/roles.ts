/**
 * Web role configuration.
 *
 * The canonical roles live in `@lpg/permissions` (which derives them from
 * the same Role union exported by `@lpg/types`). This file only:
 *
 *   • re-exports the canonical `Role` type,
 *   • re-exports `ROLE_LABELS` for UI consumption,
 *   • provides `WEB_ROLES` — the subset of roles that have a web sidebar.
 *
 * LIVREUR (PDA mobile app) is a data-layer role with grants in the permission
 * matrix but no web interface. It is included in `Role` so backend code and
 * the permission matrix stay exhaustive, but the sidebar code filters it out
 * via `isWebRole()` / `WEB_ROLES`.
 */

export {
  ROLES,
  ROLE_LABELS,
  type Role,
} from '@lpg/permissions'

import type { Role } from '@lpg/permissions'
import { isWebRole, WEB_ROLES } from '@/config/rbac/nav-items'

export { isWebRole, WEB_ROLES }

/**
 * Convenience filter — the 7 roles that have a web UI.
 */
export const WEB_ROLE_LIST: ReadonlyArray<Role> = WEB_ROLES