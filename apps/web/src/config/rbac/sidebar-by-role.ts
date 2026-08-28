/**
 * Role → sidebar routing.
 *
 * The actual sidebar content is permission-driven: see `./nav-items.ts`.
 * This file only exposes:
 *
 *   • `LANDING_BY_ROLE` — the bare feature path each role lands on after
 *     login (single source of truth; used by `routes/_authenticated/index.tsx`
 *     and the route-access guard).
 *   • `getSidebarData(role)` — delegates to `buildSidebarFor(role)`.
 *
 * Per AGENTS.md §5 there are **no role-prefixed URLs**: every nav item points
 * at a bare feature path (`/trucks`, `/marketers`, …) regardless of the
 * active role. The role only governs *which* items are visible, never the
 * URL shape. Link labels, icons, and permission codes live in `nav-items.ts`.
 *
 * All web roles land on `/overview` after login. `/dashboard` is reserved
 * for SUPERADMIN's national view (gated by `dashboard.read`). Per-role
 * dashboards for ADMIN, SUPERVISOR, MARKETEUR, TRANSPORTEUR remain available
 * at `/dashboard-admin`, `/dashboard-supervisor`, `/dashboard-marketeur`,
 * `/dashboard-transporteur` respectively, reachable from the sidebar.
 */

import type { Role } from '@lpg/permissions'
import type { SidebarData } from '@/components/layout/types'
import { buildSidebarFor } from './nav-items'

/**
 * Post-login / post-switch landing path per role. Every role lands on the
 * personalized `/overview` (AGENTS.md §5). Bare feature routes only.
 */
export const LANDING_BY_ROLE: Record<Role, string> = {
  SUPERADMIN: '/overview',
  ADMIN: '/overview',
  SUPERVISOR: '/overview',
  INTEGRATEUR: '/overview',
  AGENT: '/overview',
  MARKETEUR: '/overview',
  TRANSPORTEUR: '/overview',
  LIVREUR: '/overview',
}

/** Delegates entirely to the permission-driven projection. */
export function getSidebarData(role: Role): SidebarData {
  return buildSidebarFor(role)
}

/**
 * Landing path for a role (clamped to `/dashboard` for unknown roles).
 * Shared by the post-login redirect and the role switcher so they can never
 * drift apart.
 */
export function landingPathFor(role: Role): string {
  return LANDING_BY_ROLE[role] ?? '/dashboard'
}