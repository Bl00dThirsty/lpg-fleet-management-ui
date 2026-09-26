import { describe, expect, it } from 'vitest'
import {
  addUnitTotals,
  emptyUnitTotals,
  quantity,
  sumQuantities,
  unitForTruckType,
} from './dashboard-quantity'

describe('dashboard quantity contract', () => {
  it('carries the numeric value together with its canonical unit', () => {
    expect(quantity(12.5, 'TM')).toEqual({ value: 12.5, unit: 'TM' })
    expect(quantity(120, 'btl')).toEqual({ value: 120, unit: 'btl' })
  })

  it('maps a vehicle type to its only legal GPL unit', () => {
    expect(unitForTruckType('VRAC')).toBe('TM')
    expect(unitForTruckType('BOUTEILLES50KG')).toBe('btl')
  })

  it('refuses to sum quantities from two different units', () => {
    expect(() => sumQuantities([quantity(1, 'TM'), quantity(1, 'btl')])).toThrow(
      /unit/i,
    )
    expect(sumQuantities([quantity(1, 'TM'), quantity(2, 'TM')])).toEqual(
      quantity(3, 'TM'),
    )
  })

  it('keeps per-unit totals on separate keys', () => {
    const totals = addUnitTotals(
      { TM: quantity(4, 'TM'), btl: quantity(10, 'btl') },
      { TM: quantity(1, 'TM'), btl: quantity(0, 'btl') },
    )

    expect(totals.TM).toEqual(quantity(5, 'TM'))
    expect(totals.btl).toEqual(quantity(10, 'btl'))
    expect(emptyUnitTotals()).toEqual({
      TM: quantity(0, 'TM'),
      btl: quantity(0, 'btl'),
    })
  })
})
