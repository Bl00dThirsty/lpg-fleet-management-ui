import { describe, expect, it } from 'vitest'
import { tourPlanningSchema } from './tour-planning-schema'
const draft = {
  executionMode: 'EXTERNAL',
  cargoType: 'BOUTEILLES50KG',
  quantity: 50,
  marketerId: 'm',
  depotSiteId: 'd',
  transporterId: 't',
  vehicleId: '',
  driverId: '',
  livreurId: '',
  clientStops: [
    {
      kind: 'CLIENT_SITE',
      sequence: 2,
      destinationId: 'c',
      plannedQuantity: 50,
    },
  ],
}
describe('tour planning form', () => {
  it('allows external planning without assigning transporter crew', () =>
    expect(tourPlanningSchema.safeParse(draft).success).toBe(true))
  it('requires internal crew', () =>
    expect(
      tourPlanningSchema.safeParse({ ...draft, executionMode: 'INTERNAL' })
        .success
    ).toBe(false))
  it('rejects duplicate stops and over-allocation', () => {
    expect(
      tourPlanningSchema.safeParse({
        ...draft,
        clientStops: [...draft.clientStops, ...draft.clientStops],
      }).success
    ).toBe(false)
    expect(
      tourPlanningSchema.safeParse({ ...draft, quantity: 49 }).success
    ).toBe(false)
  })
  it('rejects fractional bottle quantities at both levels', () => {
    expect(
      tourPlanningSchema.safeParse({ ...draft, quantity: 50.5 }).success
    ).toBe(false)
    expect(
      tourPlanningSchema.safeParse({
        ...draft,
        clientStops: [{ ...draft.clientStops[0], plannedQuantity: 1.5 }],
      }).success
    ).toBe(false)
  })
})
