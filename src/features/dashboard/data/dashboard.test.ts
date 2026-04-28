import { describe, expect, it } from 'vitest'
import { buildDashboardView } from './dashboard'

describe('buildDashboardView', () => {
  it('builds the command dashboard aggregates from fleet, route, and site data', () => {
    const dashboard = buildDashboardView()

    expect(dashboard.overview).toMatchObject({
      totalTransportedKg: 53200,
      totalDeliveredKg: 17100,
      totalReserveKg: 86550,
      reserveCapacityKg: 144000,
      reserveFillPercent: 60,
      reserveCoverageDays: 5.1,
      activeTrips: 2,
      plannedTrips: 1,
      incidentTrips: 1,
      activeTrucks: 4,
      totalTrucks: 6,
      riskTrucks: 3,
      abnormalLossKg: 1850,
      openAlerts: 4,
      criticalAlerts: 2,
    })

    expect(dashboard.metrics.map((metric) => metric.id)).toEqual([
      'transported',
      'reserve',
      'delivered',
      'alerts',
    ])
    expect(dashboard.metrics[0]).toMatchObject({
      deltaPercent: 4,
      deltaDirection: 'up',
    })
    expect(dashboard.metrics[1]).toMatchObject({
      deltaPercent: -1,
      deltaDirection: 'down',
    })

    expect(
      dashboard.trendByPeriod.daily[dashboard.trendByPeriod.daily.length - 1]
    ).toEqual({
      label: "Aujourd'hui",
      transportedKg: 53200,
      deliveredKg: 17100,
      reserveKg: 86550,
      alertCount: 4,
      serviceRate: 67,
    })

    expect(dashboard.cadence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          period: 'daily',
          transportedDeltaPercent: 4,
          reserveDeltaPercent: -1,
        }),
      ])
    )
  })

  it('surfaces fleet and reserve site hotspots in priority order', () => {
    const dashboard = buildDashboardView()

    expect(dashboard.fleets).toEqual([
      expect.objectContaining({
        fleetName: 'Tradex',
        transportedKg: 28000,
        deliveredKg: 6050,
        pendingKg: 21950,
        sharePercent: 53,
        onTimeRate: 100,
      }),
      expect.objectContaining({
        fleetName: 'Total Cameroun',
        transportedKg: 25200,
        deliveredKg: 11050,
        pendingKg: 12300,
        sharePercent: 47,
        onTimeRate: 50,
      }),
    ])

    expect(dashboard.reserveSites[0]).toMatchObject({
      siteId: 'site-bonaberi-center',
      status: 'critical',
      fillPercent: 31,
      scheduledInboundKg: 12450,
      activeTripCount: 2,
    })
    expect(dashboard.reserveSites[1]).toMatchObject({
      siteId: 'site-scdp-yaounde',
      status: 'watch',
      fillPercent: 44,
      outboundKg: 14000,
    })

    expect(dashboard.alerts.map((alert) => alert.id)).toEqual([
      'route-trip-nsam-ebolowa-loss',
      'reserve-site-bonaberi-center-critical',
      'route-trip-nsam-ebolowa-eta',
      'reserve-site-scdp-yaounde-watch',
    ])
  })
})
