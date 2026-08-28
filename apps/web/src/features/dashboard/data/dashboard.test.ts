import { describe, expect, it } from 'vitest'
import type { UserScope } from '@/features/scope/scope'
import { buildDashboardView } from './dashboard'

describe('buildDashboardView', () => {
  it('builds the command dashboard aggregates from fleet, route, and site data', () => {
    const dashboard = buildDashboardView()

    expect(dashboard.overview).toMatchObject({
      totalTransportedTM: 430.45,
      totalDeliveredTM: 221.22,
      totalReserveTM: 86.55,
      reserveCapacityTM: 144,
      reserveFillPercent: 60,
      reserveCoverageDays: 0.4,
      activeTrips: 4,
      plannedTrips: 4,
      incidentTrips: 0,
      activeTrucks: 27,
      totalTrucks: 33,
      riskTrucks: 0,
      abnormalLossTM: 0,
      openAlerts: 4,
      criticalAlerts: 1,
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
      transportedTM: 430.45,
      delivered: 221.22,
      reserveTM: 86.55,
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

    expect(dashboard.fleets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fleetName: 'Neptune Gaz SARL',
          transportedTM: 120,
          delivered: 48,
          pendingTM: 72,
          sharePercent: 28,
          onTimeRate: 100,
          truckCount: 2,
        }),
        expect.objectContaining({
          fleetName: 'CSPH — Caisse de Stabilisation des Prix des Hydrocarbures',
          transportedTM: 26.85,
          delivered: 11.62,
          pendingTM: 15.23,
          sharePercent: 6,
          onTimeRate: 100,
          truckCount: 3,
        }),
        expect.objectContaining({
          fleetName: 'STARGAS Cameroun SARL',
          transportedTM: 12,
          delivered: 0,
          pendingTM: 12,
          sharePercent: 3,
          onTimeRate: 0,
          truckCount: 2,
        }),
      ])
    )

    expect(dashboard.fleets[0]!.fleetName).toBe('Neptune Gaz SARL')
    expect(dashboard.fleets[1]!.fleetName).toBe('AZA Afrigaz — Division GPL')
    expect(dashboard.fleets[0]).toMatchObject({ onTimeRate: 100 })
    expect(dashboard.fleets[1]).toMatchObject({ onTimeRate: 0 })

    expect(dashboard.reserveSites[0]).toMatchObject({
      siteId: 'site-0001-sctm-bonaberi',
      status: 'critical',
      fillPercent: 31,
      activeTripCount: 6,
    })
    expect(dashboard.reserveSites[1]).toMatchObject({
      siteId: 'site-0029-scdp-yaounde',
      status: 'watch',
      fillPercent: 44,
      activeTripCount: 0,
    })

    expect(dashboard.alerts.map((alert) => alert.id)).toEqual([
      'reserve-site-0001-sctm-bonaberi-critical',
      'tour-002-eta',
      'tour-008-eta',
      'reserve-site-0029-scdp-yaounde-watch',
    ])
  })

  it('keeps route-level contribution details for volume traceability', () => {
    const dashboard = buildDashboardView()

    expect(dashboard.routeContributions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reference: 'TRP-2405',
          carrierName: 'CSPH — Caisse de Stabilisation des Prix des Hydrocarbures',
          plateNumber: 'LT1123UB',
          loadedQuantity: 15,
          transportedSharePercent: 3,
        }),
        expect.objectContaining({
          reference: 'TRP-2409',
          carrierName: 'STARGAS Cameroun SARL',
          plateNumber: 'LT0013TL',
          loadedQuantity: 12,
        }),
        expect.objectContaining({
          reference: 'TRP-2401',
          carrierName: 'CSPH — Caisse de Stabilisation des Prix des Hydrocarbures',
          plateNumber: 'LT1123UB',
          deliveredQuantity: 11.62,
        }),
        expect.objectContaining({
          reference: 'TRP-2404',
          carrierName: 'Clinique Baptiste de Douala',
          plateNumber: 'LT9903TJ',
          loadedQuantity: 72,
          status: 'in-progress',
        }),
      ])
    )
  })

  it('scopes transported TM to the user site', () => {
    const scope: UserScope = {
      view: 'site',
      siteIds: ['site-0001-sctm-bonaberi'],
      userId: 'user-0007-sctm-marketeur',
    }
    const dash = buildDashboardView('MARKETEUR', scope)
    expect(dash.overview.totalTransportedTM).toBeGreaterThan(0)
    const orgDash = buildDashboardView('SUPERADMIN')
    expect(orgDash.overview.totalTransportedTM).toBeGreaterThanOrEqual(
      dash.overview.totalTransportedTM
    )
  })
})