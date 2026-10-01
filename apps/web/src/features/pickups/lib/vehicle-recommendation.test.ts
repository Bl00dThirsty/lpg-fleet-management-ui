import { describe, expect, it } from 'vitest'
import type { Vehicle } from '@lpg/types'
import { recommendVehicles, isCertificateValid, capacityOf } from './vehicle-recommendation'

const ORG = 'org-0002-sctm-0000-000000000001'

function vehicle(over: Partial<Vehicle>): Vehicle {
  return {
    id: 'veh-1',
    license_plate: 'LT1234UB',
    type: 'VRAC',
    org_id: ORG,
    max_volume: 24000,
    max_bottle_count: null,
    certificate_url: 'https://certifs.test/LT1234UB.pdf',
    certificate_number: 'CERT-VRAC-2024-0001',
    certificate_issued_at: '2024-01-15T00:00:00Z',
    certificate_expiry_at: '2026-02-15T00:00:00Z',
    tare_weight: 12500,
    is_active: true,
    ...over,
  }
}

const NOW = new Date('2026-01-01T00:00:00.000Z')

describe('vehicle-recommendation', () => {
  describe('isCertificateValid', () => {
    it('accepts a VRAC vehicle with an unexpired certificate', () => {
      expect(isCertificateValid(vehicle({}), NOW)).toBe(true)
    })

    it('rejects a VRAC vehicle with a missing certificate', () => {
      expect(
        isCertificateValid(vehicle({ certificate_number: '', certificate_expiry_at: null }), NOW),
      ).toBe(false)
    })

    it('rejects a VRAC vehicle with an expired certificate', () => {
      expect(
        isCertificateValid(vehicle({ certificate_expiry_at: '2025-01-01T00:00:00Z' }), NOW),
      ).toBe(false)
    })

    it('rejects a VRAC vehicle with an unparseable expiry', () => {
      expect(isCertificateValid(vehicle({ certificate_expiry_at: 'not-a-date' }), NOW)).toBe(false)
    })

    it('does not require a certificate for bottle vehicles', () => {
      const bottles = vehicle({ type: 'BOUTEILLES50KG', max_bottle_count: 120, max_volume: null })
      expect(isCertificateValid(bottles, NOW)).toBe(true)
    })
  })

  describe('capacityOf', () => {
    it('returns max_volume in TM for VRAC', () => {
      expect(capacityOf(vehicle({ max_volume: 18 }), 'VRAC')).toBe(18)
    })

    it('returns max_bottle_count for BOUTEILLES50KG', () => {
      const bottles = vehicle({ type: 'BOUTEILLES50KG', max_bottle_count: 120, max_volume: null })
      expect(capacityOf(bottles, 'BOUTEILLES50KG')).toBe(120)
    })

    it('returns null when the vehicle type does not match the requested type', () => {
      expect(capacityOf(vehicle({}), 'BOUTEILLES50KG')).toBeNull()
    })
  })

  describe('recommendVehicles', () => {
    const fleet: Vehicle[] = [
      vehicle({ id: 'veh-24000', license_plate: 'LT1123UB', max_volume: 24000 }),
      vehicle({ id: 'veh-18000', license_plate: 'LT3345UD', max_volume: 18000 }),
      vehicle({ id: 'veh-small', license_plate: 'LT1100XX', max_volume: 5000 }),
    ]

    it('returns only vehicles that can carry the full quantity, best fit first', () => {
      const res = recommendVehicles({
        quantity: 10000,
        type: 'VRAC',
        org_id: ORG,
        vehicles: fleet,
        now: NOW,
      })
      expect(res.map((r) => r.vehicle.id)).toEqual(['veh-18000', 'veh-24000'])
      expect(res[0]!.fitRatio).toBeCloseTo(10000 / 18000)
    })

    it('excludes vehicles too small for the quantity', () => {
      const res = recommendVehicles({
        quantity: 20000,
        type: 'VRAC',
        org_id: ORG,
        vehicles: fleet,
        now: NOW,
      })
      expect(res.map((r) => r.vehicle.id)).toEqual(['veh-24000'])
    })

    it('excludes vehicles from another org', () => {
      const other = vehicle({ id: 'veh-other', org_id: 'org-9999-other' })
      const res = recommendVehicles({
        quantity: 1000,
        type: 'VRAC',
        org_id: ORG,
        vehicles: [...fleet, other],
        now: NOW,
      })
      expect(res.some((r) => r.vehicle.id === 'veh-other')).toBe(false)
    })

    it('excludes inactive vehicles', () => {
      const inactive = vehicle({ id: 'veh-inactive', is_active: false })
      const res = recommendVehicles({
        quantity: 1000,
        type: 'VRAC',
        org_id: ORG,
        vehicles: [...fleet, inactive],
        now: NOW,
      })
      expect(res.some((r) => r.vehicle.id === 'veh-inactive')).toBe(false)
    })

    it('excludes vehicles with an expired VRAC certificate', () => {
      const expired = vehicle({ id: 'veh-expired', certificate_expiry_at: '2025-01-01T00:00:00Z' })
      const res = recommendVehicles({
        quantity: 1000,
        type: 'VRAC',
        org_id: ORG,
        vehicles: [...fleet, expired],
        now: NOW,
      })
      expect(res.some((r) => r.vehicle.id === 'veh-expired')).toBe(false)
    })

    it('recommends bottle vehicles by max_bottle_count', () => {
      const bottles: Vehicle[] = [
        vehicle({ id: 'btl-120', type: 'BOUTEILLES50KG', max_volume: null, max_bottle_count: 120 }),
        vehicle({ id: 'btl-64', type: 'BOUTEILLES50KG', max_volume: null, max_bottle_count: 64 }),
      ]
      const res = recommendVehicles({
        quantity: 80,
        type: 'BOUTEILLES50KG',
        org_id: ORG,
        vehicles: bottles,
        now: NOW,
      })
      expect(res.map((r) => r.vehicle.id)).toEqual(['btl-120'])
    })

    it('returns empty when no vehicle can fit', () => {
      const res = recommendVehicles({
        quantity: 50000,
        type: 'VRAC',
        org_id: ORG,
        vehicles: fleet,
        now: NOW,
      })
      expect(res).toEqual([])
    })

    it('returns empty when quantity is non-positive', () => {
      const res = recommendVehicles({
        quantity: 0,
        type: 'VRAC',
        org_id: ORG,
        vehicles: fleet,
        now: NOW,
      })
      expect(res).toEqual([])
    })

    it('caps the list at 5 recommendations', () => {
      const many = Array.from({ length: 8 }, (_, i) =>
        vehicle({ id: `veh-${i}`, license_plate: `LT1${i}00UB`, max_volume: 20000 + i }),
      )
      const res = recommendVehicles({
        quantity: 1000,
        type: 'VRAC',
        org_id: ORG,
        vehicles: many,
        now: NOW,
      })
      expect(res.length).toBe(5)
    })
  })
})
