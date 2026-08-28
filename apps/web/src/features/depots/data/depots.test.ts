import { describe, expect, it } from 'vitest'
import { getDepots, depotStatusLabel } from './depots'

describe('depots view-model', () => {
  it('only includes organizations of type DEPOT', () => {
    const depots = getDepots()
    expect(depots.length).toBe(1)
    expect(depots[0]).toMatchObject({
      name: expect.any(String),
      status: 'ACTIVE',
    })
  })

  it('exposes every DepotView field', () => {
    const [depot] = getDepots()
    expect(depot).toMatchObject({
      id: expect.any(String),
      region: expect.any(String),
      city: expect.any(String),
      sites: expect.any(Number),
      created_at: expect.any(String),
      updated_at: expect.any(String),
    })
  })

  it('labels statuses in French', () => {
    expect(depotStatusLabel('ACTIVE')).toBe('Actif')
    expect(depotStatusLabel('SUSPENDED')).toBe('Suspendu')
  })
})