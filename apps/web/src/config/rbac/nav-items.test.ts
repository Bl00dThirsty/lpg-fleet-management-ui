import { describe, expect, it } from 'vitest'
import {
  buildSidebarFor,
  NAV_CATALOG,
  resolveFeaturePath,
  ROLES,
} from './nav-items'

const deferredIds = [
  'risk-scores',
  'finance',
  'certificates',
  'devices',
  'pickups',
  'declarations',
  'reconciliations',
  'redressements',
  'anomalies-investigation',
  'anomalies-technical',
  'grafana',
  'infra',
  'prometheus',
  'system-health',
]
const deferredPaths = new Set(
  NAV_CATALOG.filter((item) => deferredIds.includes(item.id)).map(
    resolveFeaturePath,
  ),
)

describe('sidebar feature availability', () => {
  it('marks exactly the requested modules and both Grafana entries as coming soon', () => {
    expect(
      NAV_CATALOG.filter((item) => item.comingSoon)
        .map((item) => item.id)
        .sort(),
    ).toEqual([...deferredIds].sort())
  })

  for (const role of ROLES) {
    it(`keeps deferred entries visible but disabled for ${role}`, () => {
      const items = buildSidebarFor(role).navGroups.flatMap(
        (group) => group.items,
      )
      for (const item of items) {
        if (!item.url) continue
        if (deferredPaths.has(item.url)) {
          expect(item.disabled, item.title).toBe(true)
          expect(item.badge, item.title).toBe('soon')
        } else {
          expect(item.disabled, item.title).toBe(false)
          expect(item.badge, item.title).not.toBe('soon')
        }
      }
    })
  }

  it('retains the 13 requested entries for SUPERADMIN', () => {
    const items = buildSidebarFor('SUPERADMIN').navGroups.flatMap(
      (group) => group.items,
    )
    expect(items.filter((item) => item.disabled)).toHaveLength(13)
    expect(items.find((item) => item.url === '/tours')?.disabled).toBe(false)
    expect(items.find((item) => item.url === '/map')?.disabled).toBe(false)
  })

  it('does not expand permissions to make soon items visible', () => {
    const items = buildSidebarFor('TRANSPORTEUR').navGroups.flatMap(
      (group) => group.items,
    )
    expect(items.some((item) => item.url === '/finance')).toBe(false)
  })
})
