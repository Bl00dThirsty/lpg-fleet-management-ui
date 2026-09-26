import { currentLang } from '@/lib/i18n/formatters'
import {
  buildRouteSummary,
  getRouteTripsView,
} from '@/features/tours/data/tour-activity'
import { getTrucks } from '@/features/trucks/data/trucks'
import type { UserScope } from '@/features/scope/scope'
import type { Role } from '@/config/rbac/roles'
import type { DateRange } from 'react-day-picker'
import type { DashboardUnit } from './dashboard-quantity'
import {
  filterByDateRange,
  filterByFleet,
  resolveDashboardQuery,
  type DashboardQuery,
} from './dashboard-query'
import {
  buildDashboardMetrics,
  buildDashboardOverview,
  buildPeriodFacts,
  totalDeliveredFor,
  totalTransportedFor,
} from './dashboard-metrics'
import { buildFleetSummaries, buildFlowBreakdown } from './dashboard-fleets'
import { buildRouteContributions } from './dashboard-routes'
import { buildDashboardAlerts, buildRecentActivities } from './dashboard-activity'
import type {
  DashboardFlowSegment,
  DashboardFleetSummary,
} from './dashboard-fleets'
import type { DashboardRouteContribution } from './dashboard-routes'
import type { DashboardAlert, DashboardRecentActivity } from './dashboard-activity'
import type {
  DashboardMetric,
  DashboardOverview,
  DashboardPeriodFacts,
  DashboardTranslator,
} from './dashboard-metrics'

export type { DashboardUnit, DashboardQuantity } from './dashboard-quantity'
export type {
  DashboardPeriod,
  DashboardQuery,
  DashboardSearch,
} from './dashboard-query'
export type {
  DashboardMetric,
  DashboardMetricValue,
  DashboardOverview,
  DashboardPeriodFacts,
  DashboardTranslator,
  DashboardDetailId,
} from './dashboard-metrics'
export type { DashboardFleetSummary } from './dashboard-fleets'
export type { DashboardRouteContribution } from './dashboard-routes'
export type { DashboardAlert, DashboardRecentActivity } from './dashboard-activity'

/**
 * Public view contract of the national dashboard.
 *
 * `data/dashboard.ts` is only the orchestrator: every aggregate below is built
 * by a dedicated pure module in this folder, and every volume travels as a
 * `DashboardQuantity` so TM and btl can never be mixed.
 */
export type DashboardView = {
  viewRole?: Role
  overview: DashboardOverview
  metrics: DashboardMetric[]
  currentPeriod: DashboardPeriodFacts
  flowBreakdown: Record<DashboardUnit, DashboardFlowSegment[]>
  fleets: DashboardFleetSummary[]
  fleetOptions: string[]
  routeContributions: DashboardRouteContribution[]
  alerts: DashboardAlert[]
  recentActivities: DashboardRecentActivity[]
  query?: DashboardQuery
}

function formatDateRangeLabel(range: DateRange | undefined): string | null {
  if (!range?.from) return null
  const format = (date: Date) =>
    new Intl.DateTimeFormat(currentLang(), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  if (!range.to) return format(range.from)
  return `${format(range.from)} – ${format(range.to)}`
}

function latestUpdatedAt(
  trips: readonly { lastUpdatedAt: string }[],
  fallback: string,
): string {
  return trips.reduce(
    (latest, trip) =>
      new Date(trip.lastUpdatedAt) > new Date(latest)
        ? trip.lastUpdatedAt
        : latest,
    fallback,
  )
}

export function buildDashboardView(
  role?: Role,
  scope?: UserScope,
  query?: DashboardQuery,
  t: DashboardTranslator = (key) => key,
): DashboardView {
  const resolved = resolveDashboardQuery(query ?? {})
  const scopedTrucks = getTrucks(scope)
  const scopedTrips = getRouteTripsView('ALL', scope)
  const trips = filterByDateRange(
    filterByFleet(scopedTrips, resolved.fleetName),
    resolved.range,
  )
  const visibleTrucks = resolved.fleetName
    ? scopedTrucks.filter((truck) => truck.tenant_name === resolved.fleetName)
    : scopedTrucks

  const totalTransported = totalTransportedFor(trips)
  const totalDelivered = totalDeliveredFor(trips)
  const summary = buildRouteSummary(trips)
  const alerts = buildDashboardAlerts(trips, t)
  const criticalAlerts = alerts.filter((alert) => alert.severity === 'high').length

  return {
    viewRole: role,
    query,
    overview: buildDashboardOverview({
      trips,
      trucks: visibleTrucks,
      period: resolved.period,
      dateRangeLabel:
        formatDateRangeLabel(resolved.range) ?? t('period.current'),
      generatedAt: latestUpdatedAt(
        trips,
        scopedTrips[0]?.lastUpdatedAt ?? new Date().toISOString(),
      ),
      openAlerts: alerts.length,
      criticalAlerts,
      serviceRate: summary.onTimeRate,
    }),
    metrics: buildDashboardMetrics({
      trips,
      criticalAlerts,
      activeTrips: summary.activeTrips,
      serviceRate: summary.onTimeRate,
      t,
    }),
    currentPeriod: buildPeriodFacts({
      trips,
      period: resolved.period,
      alertCount: alerts.length,
      serviceRate: summary.onTimeRate,
    }),
    flowBreakdown: buildFlowBreakdown(trips, totalTransported),
    fleets: buildFleetSummaries({
      trucks: visibleTrucks,
      trips,
      totalTransported,
    }),
    fleetOptions: [...new Set(scopedTrucks.map((truck) => truck.tenant_name))].sort(),
    routeContributions: buildRouteContributions(trips, {
      totalTransported,
      totalDelivered,
    }),
    alerts,
    recentActivities: buildRecentActivities(trips, t),
  }
}
