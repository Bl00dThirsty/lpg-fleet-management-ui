import { describe, expect, it } from 'vitest'
import type { Checkpoint } from '@lpg/types'
import {
  missionQuantitySchema,
  planCheckpointQuantity,
} from './mission-quantity'
const checkpoints = [
  { id: 'source', site_id: 'depot', sequence: 1, expected_quantity: 50 },
  { id: 'a', client_site_id: 'client-a', sequence: 2, expected_quantity: 20 },
  { id: 'b', client_site_id: 'client-b', sequence: 3, expected_quantity: 25 },
] as Checkpoint[]
describe('inline mission quantities', () => {
  it('rejects fractional bottles, zero, negative and non-finite values', () => {
    for (const quantity of [1.2, 0, -1, Infinity, NaN])
      expect(
        missionQuantitySchema('BOUTEILLES50KG').safeParse({ quantity }).success
      ).toBe(false)
  })
  it('accepts fractional metric tonnes', () => {
    expect(
      missionQuantitySchema('VRAC').safeParse({ quantity: 0.25 }).success
    ).toBe(true)
  })
  it('updates only the target and loading total, preserving other stops and reserve', () => {
    const patch = planCheckpointQuantity(
      checkpoints,
      'a',
      30,
      50,
      'BOUTEILLES50KG'
    )
    expect(patch.requested_quantity).toBe(60)
    expect(patch.checkpoints.map((cp) => cp.expected_quantity)).toEqual([
      60, 30, 25,
    ])
    expect(checkpoints[0]!.expected_quantity).toBe(50)
  })
  it('rejects missing stops or editing the loading stop as a delivery', () => {
    expect(() =>
      planCheckpointQuantity(checkpoints, 'missing', 20, 50, 'VRAC')
    ).toThrow()
    expect(() =>
      planCheckpointQuantity(checkpoints, 'source', 20, 50, 'VRAC')
    ).toThrow()
  })
})
