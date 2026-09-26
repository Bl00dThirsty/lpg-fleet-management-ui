import type {
  RouteEventSeverity,
  RouteTripView,
} from '@/features/tours/data/tour-activity'
import {
  quantity,
  unitForTruckType,
  type DashboardQuantity,
  type DashboardUnit,
} from './dashboard-quantity'
import { formatDashboardQuantity } from '../lib/format-quantity'
import type { DashboardTranslator } from './dashboard-metrics'

export type QuantityFormatter = (value: number, unit: DashboardUnit) => string

export type DashboardActivityStatus = 'completed' | 'attention' | 'planned'

export type DashboardAlert = {
  id: string
  severity: RouteEventSeverity
  title: string
  description: string
  scope: string
  owner: string
  metricValue: string
}

export type DashboardRecentActivity = {
  id: string
  title: string
  description: string
  happenedAt: string
  owner: string
  location: string
  /** Absent when the event itself carries no measured volume. */
  volume?: DashboardQuantity
  status: DashboardActivityStatus
}

const SEVERITY_ORDER: Record<RouteEventSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

function corridor(trip: RouteTripView): string {
  return `${trip.originSite.city} - ${trip.destinationSite.city}`
}

/**
 * Alerts are projections of facts the tour actually carries: a critical anomaly
 * reported against the tour, or a degraded customer window on a settled tour.
 * There is deliberately no load-gap alert: no canonical field measures it.
 */
export function buildDashboardAlerts(
  trips: readonly RouteTripView[],
  t: DashboardTranslator,
): DashboardAlert[] {
  const alerts: DashboardAlert[] = []

  for (const trip of trips) {
    if (trip.attentionLevel === 'high') {
      alerts.push({
        id: `${trip.id}-anomaly`,
        severity: 'high',
        title: t('alerts.anomalyTitle', { reference: trip.reference }),
        description: t('alerts.anomalyDescription'),
        scope: corridor(trip),
        owner: trip.missionLead,
        metricValue: t('alerts.progressMetric', { value: trip.progressPercent }),
      })
    }

    if (!trip.onTime && trip.status !== 'planned') {
      alerts.push({
        id: `${trip.id}-eta`,
        severity: 'medium',
        title: t('alerts.etaTitle', { reference: trip.reference }),
        description: t('alerts.etaDescription'),
        scope: trip.customerName,
        owner: trip.missionLead,
        metricValue: t('alerts.progressMetric', { value: trip.progressPercent }),
      })
    }
  }

  return alerts.sort(
    (left, right) =>
      SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity] ||
      left.title.localeCompare(right.title),
  )
}

function eventActivities(
  trips: readonly RouteTripView[],
): DashboardRecentActivity[] {
  return trips.flatMap((trip) => {
    const unit = unitForTruckType(trip.truck.type)
    return trip.events.map((event) => ({
      id: `activity-event-${event.id}`,
      title: event.title,
      description: `${trip.reference} Â· ${event.description}`,
      happenedAt: event.occurredAt,
      owner: trip.missionLead,
      location: corridor(trip),
      // A checkpoint arrival or a route deviation measures no volume, so the
      // metric is omitted rather than filled with the tour total.
      ...(event.measuredQuantity == null
        ? {}
        : { volume: quantity(event.measuredQuantity, unit) }),
      status: event.severity === 'low' ? 'completed' : 'attention',
    }))
  })
}

function tourStatusActivities(
  trips: readonly RouteTripView[],
  t: DashboardTranslator,
  format: QuantityFormatter,
): DashboardRecentActivity[] {
  return trips
    .filter((trip) => trip.status !== 'incident')
    .map((trip) => {
      const unit = unitForTruckType(trip.truck.type)

      if (trip.status === 'completed') {
        return {
          id: `activity-trip-${trip.id}`,
          title: t('activities.completedTitle', { reference: trip.reference }),
          description: t('activities.completedDescription', {
            value: format(trip.deliveredQuantity, unit),
            destination: trip.destinationSite.name,
          }),
          happenedAt: trip.lastUpdatedAt,
          owner: trip.missionLead,
          location: trip.destinationSite.name,
          volume: quantity(trip.deliveredQuantity, unit),
          status: 'completed',
        } satisfies DashboardRecentActivity
      }

      if (trip.status === 'planned') {
        return {
          id: `activity-trip-${trip.id}`,
          title: t('activities.plannedTitle', { reference: trip.reference }),
          description: t('activities.plannedDescription', {
            value: format(trip.loadedQuantity, unit),
            destination: trip.destinationSite.name,
          }),
          happenedAt: trip.lastUpdatedAt,
          owner: trip.missionLead,
          location: trip.originSite.name,
          volume: quantity(trip.loadedQuantity, unit),
          status: 'planned',
        } satisfies DashboardRecentActivity
      }

      return {
        id: `activity-trip-${trip.id}`,
        title: t('activities.inProgressTitle', { reference: trip.reference }),
        description: t('activities.inProgressDescription', {
          value: format(trip.remainingQuantity, unit),
          destination: trip.destinationSite.name,
        }),
        happenedAt: trip.lastUpdatedAt,
        owner: trip.missionLead,
        location: corridor(trip),
        volume: quantity(trip.remainingQuantity, unit),
        status: 'attention',
      } satisfies DashboardRecentActivity
    })
}

export function buildRecentActivities(
  trips: readonly RouteTripView[],
  t: DashboardTranslator,
  format: QuantityFormatter = formatDashboardQuantity,
): DashboardRecentActivity[] {
  return [...eventActivities(trips), ...tourStatusActivities(trips, t, format)]
    .sort(
      (left, right) =>
        new Date(right.happenedAt).getTime() -
        new Date(left.happenedAt).getTime(),
    )
    .slice(0, 6)
}

