import type { AuthUser } from '@lpg/api-client'

export type ScopeView = 'org' | 'site' | 'transporter' | 'agent' | 'livreur'

export interface UserScope {
  view: ScopeView
  orgId?: string
  siteIds: string[]
  userId?: string
}

const REGULATEUR_ROLES = ['SUPERADMIN', 'ADMIN', 'SUPERVISOR', 'INTEGRATEUR']

export function getScope(user: AuthUser | null): UserScope {
  if (!user) return { view: 'org', siteIds: [] }
  const base = {
    orgId: user.org_id,
    siteIds: user.site_ids ?? [],
    userId: user.id,
  }
  if (REGULATEUR_ROLES.includes(user.system_role)) {
    return { ...base, view: 'org' }
  }
  if (user.system_role === 'MARKETEUR') return { ...base, view: 'site' }
  if (user.system_role === 'TRANSPORTEUR') return { ...base, view: 'transporter' }
  if (user.system_role === 'AGENT') return { ...base, view: 'agent' }
  if (user.system_role === 'LIVREUR') return { ...base, view: 'livreur' }
  return { ...base, view: 'org' }
}

export function isRegulateurView(scope: UserScope): boolean {
  return scope.view === 'org'
}

/** Keep rows that belong to a site in scope, or were created by the user. */
export function scopeFilter<T>(
  rows: T[],
  scope: UserScope,
  keyBy: (row: T) => string,
): T[] {
  if (scope.view === 'org') return rows
  const siteKey = new Set(scope.siteIds)
  return rows.filter((row) => siteKey.has(keyBy(row)))
}
