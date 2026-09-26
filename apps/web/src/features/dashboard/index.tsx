import { useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Main } from '@/components/layout/main'
import { type Role } from '@/config/rbac/roles'
import { getScope } from '@/features/scope/scope'
import { useAuthStore } from '@/store/auth-store'
import { useToursStore } from '@/store/tours-store'
import { buildDashboardView } from './data/dashboard'
import {
  dashboardQueryToSearch,
  parseDashboardSearch,
  type DashboardQuery,
  type DashboardSearch,
} from './data/dashboard-query'
import type { DashboardDetailId } from './data/dashboard-metrics'
import { DashboardFilters } from './components/dashboard-filters'
import { DashboardFlowBreakdown } from './components/dashboard-flow-breakdown'
import { DashboardFleetPerformance } from './components/dashboard-fleet-performance'
import { DashboardKpiCard } from './components/dashboard-kpi-card'
import { DashboardKpiStrip } from './components/dashboard-kpi-strip'
import { DashboardMetricDetails } from './components/dashboard-metric-details'
import { DashboardRecentActivity } from './components/dashboard-recent-activity'
import { DashboardVolumeChart } from './components/dashboard-volume-chart'

/**
 * Which dashboard panels are relevant to a role. SUPERADMIN/ADMIN see the full
 * national view; operational roles see only the panels that concern them.
 */
function rolePanelVisibility(role?: Role) {
  switch (role) {
    case 'SUPERVISOR':
    case 'INTEGRATEUR':
      return { flow: false, recent: true, fleet: false }
    default:
      return { flow: true, recent: true, fleet: true }
  }
}

export function DashboardPage() {
  const { t, i18n } = useTranslation('dashboard')
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as DashboardSearch
  const user = useAuthStore((s) => s.user)
  const storeTours = useToursStore((s) => s.tours)
  const storeCheckpoints = useToursStore((s) => s.checkpoints)
  const [selectedDetailId, setSelectedDetailId] =
    useState<DashboardDetailId>('transported')

  // The URL is the single source of truth of the period, range and fleet, so a
  // deep link or a trip to the fleet detail page and back keeps the context.
  const query: DashboardQuery = useMemo(
    () =>
      parseDashboardSearch({
        period: search.period,
        fleet: search.fleet,
        from: search.from,
        to: search.to,
      }),
    [search.period, search.fleet, search.from, search.to],
  )
  const actorRole = user?.system_role as Role | undefined
  const dashboard = useMemo(
    () => buildDashboardView(actorRole, getScope(user), query, t),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actorRole, user, storeTours, storeCheckpoints, query, i18n.language],
  )

  const applyQuery = (next: DashboardQuery) => {
    void navigate({
      to: '/dashboard',
      search: dashboardQueryToSearch(next),
    })
  }
  const openFleet = (fleetName: string) => {
    void navigate({
      to: '/dashboard/fleets/$fleetName',
      params: { fleetName },
      search: dashboardQueryToSearch(query),
    })
  }

  const panels = rolePanelVisibility(actorRole)

  return (
    <Main fluid className='space-y-6 bg-muted/20'>
      <section className='space-y-1'>
        <h1 className='font-manrope text-3xl font-semibold tracking-tight'>
          {t(actorRole ? `heading.${actorRole}` : 'heading.default')}
        </h1>
        <p className='max-w-3xl text-sm text-muted-foreground sm:text-base'>
          {t(actorRole ? `subtitle.${actorRole}` : 'subtitle.default')}
        </p>
      </section>

      <DashboardFilters
        query={query}
        onQueryChange={applyQuery}
        fleetOptions={dashboard.fleetOptions}
        dashboard={dashboard}
      />

      <DashboardKpiStrip dashboard={dashboard} />

      <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {dashboard.metrics.map((metric) => (
          <DashboardKpiCard
            key={metric.id}
            metric={metric}
            selected={metric.detailId === selectedDetailId}
            onSelect={
              metric.detailId
                ? () => setSelectedDetailId(metric.detailId!)
                : undefined
            }
          />
        ))}
      </section>

      <DashboardMetricDetails
        activeMetricId={selectedDetailId}
        routeContributions={dashboard.routeContributions}
        fleets={dashboard.fleets}
        alerts={dashboard.alerts}
      />

      {panels.flow ? (
        <section className='grid gap-4 xl:grid-cols-2'>
          <DashboardFlowBreakdown
            overview={dashboard.overview}
            breakdown={dashboard.flowBreakdown}
          />
          <DashboardVolumeChart
            period={dashboard.overview.period}
            transported={dashboard.overview.transported}
            delivered={dashboard.overview.delivered}
          />
        </section>
      ) : null}

      {panels.recent ? (
        <section>
          <DashboardRecentActivity activities={dashboard.recentActivities} />
        </section>
      ) : null}

      {panels.fleet ? (
        <section>
          <DashboardFleetPerformance
            fleets={dashboard.fleets}
            onSelectFleet={openFleet}
          />
        </section>
      ) : null}
    </Main>
  )
}
