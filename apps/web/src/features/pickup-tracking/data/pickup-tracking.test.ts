import { describe, expect, it } from 'vitest'
import {
  getLivePickupTrack,
  getRecentPickupTrack,
  getSitePickupLoad,
  getPickupTrackSummary,
  pickupStageLabel,
  PICKUP_STAGES,
} from './pickup-tracking'

describe('pickup-tracking view-model', () => {
  it('only surfaces live (validated/in-progress) pickups', () => {
    const live = getLivePickupTrack()
    for (const row of live) {
      expect(['VALIDATED', 'INPROGRESS']).toContain(row.status)
      expect(row.stage).toBeGreaterThanOrEqual(1)
    }
  })

  it('returns recent non-draft pickups in date order', () => {
    const recent = getRecentPickupTrack()
    expect(recent.length).toBeGreaterThanOrEqual(1)
    for (let i = 1; i < recent.length; i++) {
      expect(recent[i - 1]!.requested_at >= recent[i]!.requested_at).toBe(true)
    }
  })

  it('labels pickup stages', () => {
    expect(PICKUP_STAGES).toHaveLength(4)
    expect(pickupStageLabel('INPROGRESS')).toBe('En cours')
    expect(pickupStageLabel('CANCELLED')).toBe('Annulée')
  })

  it('aggregates site inbound/outbound loads', () => {
    const loads = getSitePickupLoad()
    const total = loads.reduce((acc, l) => acc + l.outbound + l.inbound, 0)
    expect(total).toBeGreaterThan(0)
  })

  it('summarizes live buckets', () => {
    const summary = getPickupTrackSummary(getLivePickupTrack())
    expect(summary.inProgress + summary.validated).toBe(getLivePickupTrack().length)
  })
})