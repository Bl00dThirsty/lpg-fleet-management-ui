import { describe, expect, it } from 'vitest'
import { pickupWizardSchema } from './pickup-wizard-schema'
const plan = {
  marketeur_org_id: 'sctm',
  source_site_id: 'snh',
  destination_site_id: 'sctm-site',
  scheduled_at: '2026-10-05T08:30',
  requested_quantity: 2.5,
  type: 'VRAC',
  vehicle_id: 'truck',
  driver_id: 'driver',
  livreur_user_id: 'livreur',
}
describe('pickup planning', () => {
  it('accepts metric tonnes and rejects fractional bottles', () => {
    expect(pickupWizardSchema.safeParse(plan).success).toBe(true)
    expect(
      pickupWizardSchema.safeParse({ ...plan, type: 'BOUTEILLES50KG' }).success,
    ).toBe(false)
  })
  it('requires a date, a distinct destination and the complete crew', () => {
    for (const patch of [
      { scheduled_at: 'invalid' },
      { destination_site_id: 'snh' },
      { vehicle_id: '' },
      { driver_id: '' },
      { livreur_user_id: '' },
      { requested_quantity: NaN },
    ]) {
      expect(pickupWizardSchema.safeParse({ ...plan, ...patch }).success).toBe(
        false,
      )
    }
  })
})
