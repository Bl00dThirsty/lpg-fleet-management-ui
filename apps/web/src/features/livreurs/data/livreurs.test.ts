import { describe, expect, it } from 'vitest'
import type { UserScope } from '@/features/scope/scope'
import type { User as CuratedUser } from '@lpg/types'
import { getLivreurs, livreurStatusLabel } from './livreurs'

const users = [
  { id: 'l1', first_name: 'Site', last_name: 'Livreur', email: 'site@example.com', org_id: 'org-site', system_role: 'LIVREUR', is_active: true, deleted_at: null },
  { id: 'l2', first_name: 'Other', last_name: 'Livreur', email: 'other@example.com', org_id: 'org-other', system_role: 'LIVREUR', is_active: true, deleted_at: null },
  { id: 'deleted', first_name: 'Deleted', last_name: 'Livreur', email: 'deleted@example.com', org_id: 'org-site', system_role: 'LIVREUR', is_active: true, deleted_at: '2026-01-01T00:00:00.000Z' },
  { id: 'admin', first_name: 'Not', last_name: 'Livreur', email: 'admin@example.com', org_id: 'org-site', system_role: 'ADMIN', is_active: true, deleted_at: null },
] as unknown as CuratedUser[]

const scoped = (view: UserScope['view'], orgId: string): UserScope => ({
  view,
  orgId,
  siteIds: [],
})

describe('livreurs view-model', () => {
  it('only includes users with the LIVREUR role', () => {
    const livreurs = getLivreurs()
    expect(livreurs.length).toBe(5)
    for (const livreur of livreurs) {
      expect(livreur.fullName).toBeTruthy()
      expect(livreur.orgName).toBeTruthy()
    }
  })

  it('limits MARKETEUR and TRANSPORTEUR reads to their organization', () => {
    expect(getLivreurs(users, scoped('site', 'org-site')).map((user) => user.id)).toEqual(['l1'])
    expect(getLivreurs(users, scoped('transporter', 'org-other')).map((user) => user.id)).toEqual(['l2'])
  })

  it('does not expose other organizations to AGENT or LIVREUR views', () => {
    expect(getLivreurs(users, scoped('agent', 'org-site')).map((user) => user.id)).toEqual(['l1'])
    expect(getLivreurs(users, scoped('livreur', 'org-other')).map((user) => user.id)).toEqual(['l2'])
  })

  it('keeps all live livreurs for the regulateur organization view', () => {
    expect(getLivreurs(users, { view: 'org', siteIds: [] }).map((user) => user.id)).toEqual(['l1', 'l2'])
  })

  it('labels statuses in French', () => {
    expect(livreurStatusLabel('ACTIVE')).toBe('Actif')
    expect(livreurStatusLabel('INACTIVE')).toBe('Inactif')
  })
})
