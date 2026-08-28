/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest'
import {
  PICKUP_SOURCE_FUNCTIONS,
  hasFunction,
  isFillingCentre,
  isSupplyOrigin,
  siteFunctionsLabel,
  SITE_FUNCTION_LABELS,
} from './site-functions'
import type { SiteFunction } from '@lpg/types'

describe('site-functions', () => {
  it('labels are French and cover every function', () => {
    expect(SITE_FUNCTION_LABELS.CENTREEMPLISSEUR).toBe('Centre emplisseur')
    expect(SITE_FUNCTION_LABELS.ENTREPOT).toBe('Entrepôt')
    expect(SITE_FUNCTION_LABELS.POINTAPPROVISIONABLE).toBe('Point d\'approvisionnement')
  })

  it('hasFunction detects a single function within a multi-function site', () => {
    const site = { id: 's', functions: ['CENTREEMPLISSEUR', 'ENTREPOT'] as SiteFunction[] }
    expect(hasFunction(site, 'CENTREEMPLISSEUR')).toBe(true)
    expect(hasFunction(site, 'POINTAPPROVISIONABLE')).toBe(false)
  })

  it('isFillingCentre matches any CENTREEMPLISSEUR site', () => {
    expect(isFillingCentre({ functions: ['CENTREEMPLISSEUR'] })).toBe(true)
    expect(isFillingCentre({ functions: ['CENTREEMPLISSEUR', 'ENTREPOT'] })).toBe(true)
    expect(isFillingCentre({ functions: ['ENTREPOT'] })).toBe(false)
    expect(isFillingCentre({ functions: [] })).toBe(false)
    expect(isFillingCentre({ functions: null })).toBe(false)
  })

  it('isSupplyOrigin allows centres and supply points, rejects storage-only', () => {
    expect(isSupplyOrigin({ functions: ['CENTREEMPLISSEUR'] })).toBe(true)
    expect(isSupplyOrigin({ functions: ['POINTAPPROVISIONABLE'] })).toBe(true)
    expect(isSupplyOrigin({ functions: ['CENTREEMPLISSEUR', 'ENTREPOT'] })).toBe(true)
    expect(isSupplyOrigin({ functions: ['ENTREPOT'] })).toBe(false)
    expect(isSupplyOrigin({ functions: [] })).toBe(false)
    expect(isSupplyOrigin({})).toBe(false)
  })

  it('uses the settings-driven allowed set (fallback when unset)', () => {
    expect(PICKUP_SOURCE_FUNCTIONS).toEqual(['CENTREEMPLISSEUR', 'POINTAPPROVISIONABLE'])
    expect(isSupplyOrigin({ functions: ['ENTREPOT'] })).toBe(false)
  })

  it('siteFunctionsLabel formats multi-function sites', () => {
    expect(siteFunctionsLabel({ functions: ['CENTREEMPLISSEUR', 'ENTREPOT'] })).toBe('Centre emplisseur, Entrepôt')
    expect(siteFunctionsLabel({ functions: [] })).toBe('—')
    expect(siteFunctionsLabel({})).toBe('—')
  })
})
