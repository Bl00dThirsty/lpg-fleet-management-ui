import {
  buildRouteSummary,
  isActiveTourStatus,
  type RouteTripView,
} from '@/features/tours/data/tour-activity'
import type { Truck } from '@/features/trucks/data/trucks'
import {
  accumulateUnitTotals,
  emptyUnitTotals,
  quantity,
  unitForTruckType,
  type DashboardMetricValue,
  type DashboardUnitTotals,
} from './dashboard-quantity'
import type { DashboardPeriod } from './dashboard-query'

export type { DashboardPeriod } from './dashboard-query'
export type { DashboardMetricValue } from './dashboard-quantity'

export type DashboardTranslator = (
  key: string,
  params?: Record<string, string | number>,
) => string

export type DashboardMetricTone = 'sky' | 'emerald' | 'amber' | 'rose'

export type DashboardDetailId = 'transported' | 'delivered' | 'alerts'

export type DashboardMetric = {
  id: string
  title: string
  value: DashboardMetricValue
  tone: DashboardMetricTone
  description: string
  highlight: string
  /** Only the volume and alert KPIs have a drill-down panel. */
  detailId?: DashboardDetailId
}

export type DashboardOverview = {
  period: DashboardPeriod
  dateRangeLabel: string
  generatedAt: string
  transported: DashboardUnitTotals
  delivered: DashboardUnitTotals
  activeTrips: number
  plannedTrips: number
  completedTrips: number
  incidentTrips: number
  activeTrucks: number
  totalTrucks: number
  riskTrucks: number
  openAlerts: number
  criticalAlerts: number
  serviceRate: number
}

export type DashboardPeriodFacts = {
  period: DashboardPeriod
  transported: DashboardUnitTotals
  delivered: DashboardUnitTotals
  alertCount: number
  serviceRate: number
}

export function totalTransportedFor(
  trips: readonly RouteTripView[],
): DashboardUnitTotals {
  return trips.reduce<DashboardUnitTotals>(
    (totals, trip) =>
      accumulateUnitTotals(
        totals,
        quantity(trip.loadedQuantity, unitForTruckType(trip.truck.type)),
      ),
    emptyUnitTotals(),
  )
}

export function totalDeliveredFor(
  trips: readonly RouteTripView[],
): DashboardUnitTotals {
  return trips.reduce<DashboardUnitTotals>(
    (totals, trip) =>
      accumulateUnitTotals(
        totals,
        quantity(trip.deliveredQuantity, unitForTruckType(trip.truck.type)),
      ),
    emptyUnitTotals(),
  )
}

export type DashboardOverviewInput = {
  trips: readonly RouteTripView[]
  trucks: readonly Truck[]
  period: DashboardPeriod
  dateRangeLabel: string
  generatedAt: string
  openAlerts: number
  criticalAlerts: number
  serviceRate: number
}

export function buildDashboardOverview(
  input: DashboardOverviewInput,
): DashboardOverview {
  const summary = buildRouteSummary(input.trips)

  return {
    period: input.period,
    dateRangeLabel: input.dateRangeLabel,
    generatedAt: input.generatedAt,
    transported: totalTransportedFor(input.trips),
    delivered: totalDeliveredFor(input.trips),
    activeTrips: summary.activeTrips,
    plannedTrips: summary.plannedTrips,
    completedTrips: summary.completedTrips,
    incidentTrips: summary.incidentTrips,
    // A truck is mobilized only while its tour is physically running.
    activeTrucks: input.trucks.filter((truck) =>
      isActiveTourStatus(truck.tournee_status),
    ).length,
    totalTrucks: input.trucks.length,
    riskTrucks: input.trucks.filter((truck) => truck.risk_level !== 'FAIBLE')
      .length,
    openAlerts: input.openAlerts,
    criticalAlerts: input.criticalAlerts,
    serviceRate: input.serviceRate,
  }
}

export type DashboardMetricsInput = {
  trips: readonly RouteTripView[]
  criticalAlerts: number
  activeTrips: number
  serviceRate: number
  t: DashboardTranslator
}

export function buildDashboardMetrics(
  input: DashboardMetricsInput,
): DashboardMetric[] {
  const transported = totalTransportedFor(input.trips)
  const delivered = totalDeliveredFor(input.trips)
  const { t } = input

  return [
    {
      id: 'transported',
      detailId: 'transported',
      title: t('metrics.transported.title'),
      value: { kind: 'quantity', quantity: transported.TM },
      tone: 'sky',
      description: t('metrics.transported.description'),
      highlight: t('metrics.transported.highlight', {
        count: input.activeTrips,
      }),
    },
    {
      id: 'delivered',
      detailId: 'delivered',
      title: t('metrics.delivered.title'),
      value: { kind: 'quantity', quantity: delivered.TM },
      tone: 'emerald',
      description: t('metrics.delivered.description'),
      highlight: t('metrics.delivered.highlight', { value: input.serviceRate }),
    },
    {
      id: 'transported-bottles',
      title: t('metrics.transportedBottles.title'),
      value: { kind: 'quantity', quantity: transported.btl },
      tone: 'sky',
      description: t('metrics.transportedBottles.description'),
      highlight: t('metrics.transportedBottles.highlight', {
        value: input.activeTrips,
      }),
    },
    {
      id: 'delivered-bottles',
      title: t('metrics.deliveredBottles.title'),
      value: { kind: 'quantity', quantity: delivered.btl },
      tone: 'emerald',
      description: t('metrics.deliveredBottles.description'),
      highlight: t('metrics.deliveredBottles.highlight', {
        value: input.serviceRate,
      }),
    },
    {
      id: 'alerts',
      detailId: 'alerts',
      title: t('metrics.alerts.title'),
      value: { kind: 'count', count: input.criticalAlerts },
      tone: 'rose',
      description: t('metrics.alerts.description'),
      highlight: t('metrics.alerts.highlight', { count: input.criticalAlerts }),
    },
  ]
}

export function buildPeriodFacts(input: {
  trips: readonly RouteTripView[]
  period: DashboardPeriod
  alertCount: number
  serviceRate: number
}): DashboardPeriodFacts {
  return {
    period: input.period,
    transported: totalTransportedFor(input.trips),
    delivered: totalDeliveredFor(input.trips),
    alertCount: input.alertCount,
    serviceRate: input.serviceRate,
  }
}
