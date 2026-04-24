import { describe, expect, it } from 'vitest'
import { buildRouteSummary, getRouteTripsView } from './routes'

describe('getRouteTripsView', () => {
  it('resolves the route dataset into a UI-friendly view model', () => {
    const trips = getRouteTripsView()
    const selectedTrip = trips[0]

    expect(selectedTrip.id).toBe('route-trip-bipaga-bonaberi')
    expect(selectedTrip.truck.id).toBe('TRX-CM-005')
    expect(selectedTrip.originSite.id).toBe('site-bipaga')
    expect(selectedTrip.destinationSite.id).toBe('site-bonaberi-center')
    expect(selectedTrip.stops).toHaveLength(3)
    expect(selectedTrip.nextStop.site.id).toBe('site-bonaberi-center')
    expect(selectedTrip.deliveredPercent).toBe(33)
    expect(selectedTrip.remainingPercent).toBe(67)
    expect(selectedTrip.unaccountedKg).toBe(0)
    expect(selectedTrip.attentionLevel).toBe('medium')
  })
})

describe('buildRouteSummary', () => {
  it('aggregates the route portfolio for the command center header', () => {
    expect(buildRouteSummary(getRouteTripsView())).toEqual({
      totalTrips: 4,
      activeTrips: 2,
      plannedTrips: 1,
      completedTrips: 1,
      incidentTrips: 1,
      activeVolumeKg: 32500,
      deliveredVolumeKg: 17100,
      onTimeRate: 67,
      attentionCount: 2,
    })
  })
})
