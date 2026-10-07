import { describe, expect, it } from 'vitest'
import {
  ACTIVITY_STATUS_DEFAULTS,
  resolveDefaultActivityStatus,
} from './defaults'

describe('Activity Status Defaults', () => {
  it('covers all 4 activity kinds', () => {
    const activities = new Set(ACTIVITY_STATUS_DEFAULTS.map((s) => s.activity))
    expect(activities).toEqual(
      new Set(['TOUR', 'PICKUP', 'CHECKPOINT', 'CONTRACT']),
    )
  })

  it('contains expected status counts per activity', () => {
    const tour = ACTIVITY_STATUS_DEFAULTS.filter(
      (s) => s.activity === 'TOUR',
    )
    const pickup = ACTIVITY_STATUS_DEFAULTS.filter(
      (s) => s.activity === 'PICKUP',
    )
    const checkpoint = ACTIVITY_STATUS_DEFAULTS.filter(
      (s) => s.activity === 'CHECKPOINT',
    )
    const contract = ACTIVITY_STATUS_DEFAULTS.filter(
      (s) => s.activity === 'CONTRACT',
    )

    expect(tour).toHaveLength(8)
    expect(pickup).toHaveLength(5)
    expect(checkpoint).toHaveLength(4)
    expect(contract).toHaveLength(7)
  })

  it('resolves individual status correctly with 3-char code and description', () => {
    const planned = resolveDefaultActivityStatus('TOUR', 'PLANNED')
    expect(planned).toBeDefined()
    expect(planned?.code).toBe('PLN')
    expect(planned?.label).toBe('Planifiée')
    expect(planned?.tone).toBe('sky')
    expect(planned?.description).toContain('prête pour le chargement')

    const pendingAck = resolveDefaultActivityStatus(
      'TOUR',
      'PENDINGTRANSPORTERACK',
    )
    expect(pendingAck?.code).toBe('ATT')
    expect(pendingAck?.tone).toBe('amber')
  })
})
