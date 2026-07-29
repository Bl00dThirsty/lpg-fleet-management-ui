import { describe, expect, it } from 'vitest'
import { generateBreadcrumbs } from './breadcrumbs'

describe('generateBreadcrumbs', () => {
  it('returns empty for root path', () => {
    expect(generateBreadcrumbs('/')).toEqual([])
  })

  it('builds a single crumb for a top-level route', () => {
    expect(generateBreadcrumbs('/vehicles')).toEqual([
      { label: 'Véhicules', to: '/vehicles' },
    ])
  })

  it('builds nested crumbs for a sub-route', () => {
    expect(generateBreadcrumbs('/settings/profile')).toEqual([
      { label: 'Paramètres', to: '/settings' },
      { label: 'Profil', to: '/settings/profile' },
    ])
  })

  it('strips trailing slash on non-root paths', () => {
    expect(generateBreadcrumbs('/vehicles/')).toEqual([
      { label: 'Véhicules', to: '/vehicles' },
    ])
  })

  it('ignores empty segments', () => {
    expect(generateBreadcrumbs('//vehicles')).toEqual([
      { label: 'Véhicules', to: '/vehicles' },
    ])
  })
})
