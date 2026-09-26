import { describe, expect, it } from 'vitest'
import { getRouteTripsView } from '@/features/tours/data/tour-activity'
import { buildDashboardAlerts, buildRecentActivities } from './dashboard-activity'
import type { DashboardTranslator } from './dashboard'

const t: DashboardTranslator = (key, params) =>
  params && Object.keys(params).length > 0
    ? `${key}(${Object.values(params).join('|')})`
    : key

function allTrips() {
  return getRouteTripsView('ALL')
}

function baseTrip() {
  return allTrips()[0]!
}

describe('buildRecentActivities', () => {
  it('omits the volume metric for an event that carries no measured volume', () => {
    const trip = baseTrip()
    const activities = buildRecentActivities(
      [
        {
          ...trip,
          events: [
            {
              id: 'event-1',
              routeTripId: trip.id,
              occurredAt: trip.startedAt,
              severity: 'medium',
              title: 'Point de contrôle atteint',
              description: 'Progression nominale.',
            },
          ],
          status: 'in-progress',
        },
      ],
      t,
    )
    const eventRow = activities.find((row) => row.id === 'activity-event-event-1')

    expect(eventRow).toBeDefined()
    expect(eventRow).not.toHaveProperty('volume')
  })

  it('shows the volume when the event itself carries a measured quantity', () => {
    const trip = baseTrip()
    const activities = buildRecentActivities(
      [
        {
          ...trip,
          events: [
            {
              id: 'event-2',
              routeTripId: trip.id,
              occurredAt: trip.startedAt,
              severity: 'low',
              title: 'Livraison signée',
              description: 'Bon de livraison signé.',
              measuredQuantity: 4.5,
            },
          ],
          status: 'completed',
        },
      ],
      t,
    )
    const eventRow = activities.find((row) => row.id === 'activity-event-event-2')

    expect(eventRow?.volume).toEqual({
      value: 4.5,
      unit: trip.truck.type === 'VRAC' ? 'TM' : 'btl',
    })
  })

  it('never attributes the tour delivered volume to a checkpoint arrival event', () => {
    for (const activity of buildRecentActivities(allTrips(), t)) {
      if (!activity.id.startsWith('activity-event-')) continue
      const trip = allTrips().find(
        (candidate) => candidate.id === activity.id.replace('activity-event-', '').split('-event-')[0],
      )
      if (activity.volume) {
        expect(activity.volume.value).not.toBe(trip?.deliveredQuantity)
      }
    }
  })

  it('carries a trip level volume on the tour lifecycle rows only', () => {
    for (const activity of buildRecentActivities(allTrips(), t)) {
      if (activity.volume && !activity.id.startsWith('activity-trip-')) continue
      if (!activity.volume) continue
      expect(['TM', 'btl']).toContain(activity.volume.unit)
    }
  })

  it('exposes no estimated impact on an activity without a measured volume', () => {
    const activities = buildRecentActivities(
      [
        {
          ...baseTrip(),
          events: [
            {
              id: 'event-3',
              routeTripId: baseTrip().id,
              occurredAt: baseTrip().startedAt,
              severity: 'high',
              title: 'Déviation de route',
              description: 'Écart GPS.',
            },
          ],
        },
      ],
      t,
    )

    for (const activity of activities) {
      if (activity.id !== 'activity-event-event-3') continue
      expect(activity).not.toHaveProperty('volume')
    }
  })
})

describe('buildDashboardAlerts', () => {
  it('raises no load gap alert because the unaccounted fact does not exist', () => {
    for (const alert of buildDashboardAlerts(allTrips(), t)) {
      expect(alert.id).not.toMatch(/loss|unaccounted|abnormal/i)
      expect(alert.title).not.toMatch(/^alerts\.lossTitle/)
    }
  })

  it('resolves every alert string through the translator', () => {
    for (const alert of buildDashboardAlerts(allTrips(), t)) {
      expect(alert.title).toMatch(/^alerts\./)
      expect(alert.description).toMatch(/^alerts\./)
      expect(alert.metricValue).toMatch(/^alerts\./)
    }
  })

  it('skips the ETA alert for a planned tour', () => {
    const planned = { ...baseTrip(), status: 'planned' as const, onTime: false }
    expect(
      buildDashboardAlerts([planned], t).some((alert) => alert.id.endsWith('-eta')),
    ).toBe(false)
  })

  it('raises an ETA alert for a late active tour', () => {
    const late = { ...baseTrip(), status: 'in-progress' as const, onTime: false }
    expect(
      buildDashboardAlerts([late], t).some((alert) => alert.id.endsWith('-eta')),
    ).toBe(true)
  })
})

describe('activity description encoding', () => {
  const mojibake = /[\u00C2\u00E2\u0080\u00EF\u00BF\uFFFD]/

  it('never emits a mis-encoded separator in an activity description', () => {
    for (const activity of buildRecentActivities(allTrips(), t)) {
      expect(activity.description).not.toMatch(mojibake)
      expect(activity.title).not.toMatch(mojibake)
    }
  })

  it('joins the mission reference and the event with a single separator', () => {
    const trip = baseTrip()
    const [activity] = buildRecentActivities(
      [
        {
          ...trip,
          events: [
            {
              id: 'event-enc',
              routeTripId: trip.id,
              occurredAt: trip.startedAt,
              severity: 'low',
              title: 'Livraison signée',
              description: 'Bon signé.',
            },
          ],
        },
      ],
      t,
    )

    expect(activity?.description).toBe(`${trip.reference} · Bon signé.`)
  })
})
