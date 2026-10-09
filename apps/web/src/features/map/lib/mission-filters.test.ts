import { describe, expect, it } from 'vitest'
import type { DeliveryTour, Checkpoint } from '@lpg/types'
import type { AuthUser } from '@lpg/api-client'
import {
  EMPTY_MISSION_FILTERS,
  canSeeMapMission,
  matchesMissionFilters,
  missionDay,
} from './mission-filters'
import { buildMapMission } from '../data/map-missions'
const tour = {
  id: 'tour',
  marketeur_org_id: 'a',
  status: 'PLANNED',
  scheduled_at: '2026-10-08T23:30:00Z',
  source_site_id: 'site-a',
  mission_kind: 'DELIVERY',
} as DeliveryTour
const filters = { from: '2026-10-09', to: '2026-10-09', statuses: [] }
describe('map mission filters', () => {
  it('uses the planned Cameroon calendar date and inclusive bounds', () => {
    expect(missionDay(tour)).toBe('2026-10-09')
    expect(matchesMissionFilters(tour, 'a', filters)).toBe(true)
    expect(
      matchesMissionFilters(tour, 'a', { ...filters, to: '2026-10-08' })
    ).toBe(false)
  })
  it('falls back to actual departure, never creation date', () => {
    expect(
      missionDay({
        ...tour,
        scheduled_at: null,
        started_at: '2026-10-10T10:00:00Z',
      })
    ).toBe('2026-10-10')
    expect(
      matchesMissionFilters(
        { ...tour, scheduled_at: null, created_at: '2026-10-09' },
        'a',
        filters
      )
    ).toBe(false)
    expect(
      matchesMissionFilters(
        { ...tour, scheduled_at: null },
        'a',
        EMPTY_MISSION_FILTERS
      )
    ).toBe(true)
  })
  it('combines marketer, date and multiple statuses', () => {
    expect(matchesMissionFilters(tour, 'b', EMPTY_MISSION_FILTERS)).toBe(false)
    expect(
      matchesMissionFilters(tour, 'a', {
        ...filters,
        statuses: ['PLANNED', 'INPROGRESS'],
      })
    ).toBe(true)
    expect(
      matchesMissionFilters(tour, 'a', { ...filters, statuses: ['CLOSED'] })
    ).toBe(false)
  })
  it('excludes pickups, deleted missions and dates outside an open interval', () => {
    expect(
      matchesMissionFilters(
        { ...tour, mission_kind: 'PICKUP' },
        null,
        EMPTY_MISSION_FILTERS
      )
    ).toBe(false)
    expect(
      matchesMissionFilters(
        { ...tour, deleted_at: '2026-10-09' },
        null,
        EMPTY_MISSION_FILTERS
      )
    ).toBe(false)
    expect(
      matchesMissionFilters(tour, null, {
        ...EMPTY_MISSION_FILTERS,
        from: '2026-10-10',
      })
    ).toBe(false)
  })
  it('enforces agent site, transporter and driver assignment', () => {
    const agent = {
      id: 'agent',
      system_role: 'AGENT',
      org_type: 'REGULATEUR',
      site_ids: ['other'],
    } as AuthUser
    expect(canSeeMapMission(tour, agent)).toBe(false)
    expect(canSeeMapMission(tour, { ...agent, site_ids: ['site-a'] })).toBe(
      true
    )
    expect(canSeeMapMission(tour, null)).toBe(false)
    expect(
      canSeeMapMission({ ...tour, transporter_org_id: 'carrier' }, {
        id: 't',
        system_role: 'TRANSPORTEUR',
        org_id: 'carrier',
      } as AuthUser)
    ).toBe(true)
    expect(
      canSeeMapMission(tour, {
        id: 'driver',
        system_role: 'LIVREUR',
        org_id: 'a',
      } as AuthUser)
    ).toBe(false)
  })
  it('keeps missing GPS explicit and orders checkpoints without inventing points', () => {
    const points = [
      { id: 'last', sequence: 2, latitude: 3.8, longitude: 11.5 },
      { id: 'first', sequence: 1 },
    ] as unknown as Checkpoint[]
    const row = buildMapMission(tour, points, [], [])
    expect(row.stops.map((s) => s.id)).toEqual(['first', 'last'])
    expect(row.stops[0]!.coordinates).toBeNull()
    expect(row.stops[1]!.coordinates).toEqual([11.5, 3.8])
    expect(row.missingCoordinates).toBe(true)
    expect(points[0]!.id).toBe('last')
  })
})
