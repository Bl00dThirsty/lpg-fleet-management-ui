import { useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  ShieldAlert,
  Truck,
  Gauge,
  Droplets,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { type Role } from '@/config/rbac/roles'
import { Main } from '@/components/layout/main'
import { formatTm, formatBtl } from '@/features/map/utils/format'
import { getScope } from '@/features/scope/scope'
import { useAuthStore } from '@/store/auth-store'
import { useToursStore } from '@/store/tours-store'
import {
  buildDashboardView,
  type DashboardActivityStatus,
  type DashboardBreakdownItem,
  type DashboardFleetSummary,
  type DashboardMetric,
  type DashboardPeriod,
  type DashboardQuery,
  type DashboardRecentActivity,
  type DashboardReserveSite,
  type DashboardRouteContribution,
} from './data/dashboard'
import { DashboardFilters } from './components/dashboard-filters'
import { trucks } from '@/features/trucks/data/trucks'

export function DashboardPage({ role }: { role?: Role } = {}) {
  const user = useAuthStore((s) => s.user)
  // Subscribe to the tours store so the command center refreshes after a tour
  // is created/acknowledged/closed in-session (buildDashboardView reads the
  // store imperatively via getRouteTripsView).
  const storeTours = useToursStore((s) => s.tours)
  const storeCheckpoints = useToursStore((s) => s.checkpoints)
  const [query, setQuery] = useState<DashboardQuery>({ period: 'daily' })
  const dashboard = useMemo(
    () => buildDashboardView(role, getScope(user), query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [role, user, storeTours, storeCheckpoints, query]
  )
  const [selectedDetailId, setSelectedDetailId] =
    useState<DashboardDetailId>('transported')
  const allFleetNames = useMemo(
    () => [...new Set(trucks.map((truck) => truck.tenant_name))].sort(),
    []
  )
  const monthlySeries = dashboard.trendByPeriod.monthly
  // Sparkline adapts to active period for KPI context
  const activeSparkline = useMemo(() => {
    const period: DashboardPeriod = query.period ?? 'daily'
    return dashboard.trendByPeriod[period].map((item) => item.alertCount)
  }, [dashboard.trendByPeriod, query.period])
  const panels = rolePanelVisibility(role)

  const heading =
    role === 'SUPERADMIN'
      ? 'Pilotage national'
      : role === 'ADMIN'
        ? 'Tableau de bord administration'
        : role === 'SUPERVISOR'
          ? 'Métriques système'
          : role === 'INTEGRATEUR'
            ? 'Activation matériel'
            : role === 'AGENT'
              ? 'Vue consolidée agent'
              : role === 'MARKETEUR'
                ? 'Pilotage marketeur'
                : role === 'TRANSPORTEUR'
                  ? 'État de la flotte'
                  : 'Tableau de bord global'
  const subtitle =
    role === 'SUPERADMIN'
      ? 'Vue nationale des volumes, traçabilité et anomalies agrégées.'
      : role === 'ADMIN'
        ? 'Administration des utilisateurs, marketeurs et validations.'
        : role === 'SUPERVISOR'
          ? 'Santé services, alertes infrastructure et risques.'
          : role === 'INTEGRATEUR'
            ? 'Parc PDA/GPS/RFID et authentification des appareils.'
            : role === 'AGENT'
              ? 'Suivi marketeurs assignés et visites terrain.'
              : role === 'MARKETEUR'
                ? 'Flotte, quotas, tournées et clients.'
                : role === 'TRANSPORTEUR'
                  ? 'Flotte, tournées, scans et points de contrôle.'
                  : 'Pilotage consolidé des volumes transportés, de la réserve utile et des signaux récents du réseau GPL.'

  return (
    <Main fluid className='space-y-6 bg-muted/20'>
      <section className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
        <div className='space-y-1'>
          <h1 className='font-manrope text-3xl font-semibold tracking-tight'>
            {heading}
          </h1>
          <p className='max-w-3xl text-sm text-muted-foreground sm:text-base'>
            {subtitle}
          </p>
        </div>
      </section>

      <DashboardFilters
        query={query}
        onQueryChange={setQuery}
        fleetOptions={allFleetNames}
        dashboard={dashboard}
      />

      <SecondaryKpiStrip dashboard={dashboard} />

      <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {dashboard.metrics.map((metric) => (
          <MetricCard
            key={metric.id}
            metric={metric}
            sparkline={
              metric.id === 'alerts' ? activeSparkline : null
            }
            selected={metric.id === selectedDetailId}
            onSelect={() => setSelectedDetailId(metric.id as DashboardDetailId)}
          />
        ))}
      </section>

      <MetricDetailsPanel
        activeMetricId={selectedDetailId}
        routeContributions={dashboard.routeContributions}
        fleets={dashboard.fleets}
        reserveSites={dashboard.reserveSites}
        alerts={dashboard.alerts}
      />

      {panels.flow ? (
        <section className='grid gap-4 xl:grid-cols-[1.05fr_1fr_0.95fr]'>
          <FlowBreakdownCard
            totalTransportedTM={dashboard.overview.totalTransportedTM}
            breakdown={dashboard.flowBreakdown}
            deltaPercent={dashboard.metrics[0]?.deltaPercent ?? 0}
          />

          <MonthlyVolumesCard series={monthlySeries} />

          <ReserveSummaryCard
            totalReserveTM={dashboard.overview.totalReserveTM}
            summary={dashboard.reserveSummary}
          />
        </section>
      ) : null}

      {panels.recent ? (
        <section className='grid gap-4 xl:grid-cols-[1.15fr_0.85fr]'>
          <RecentActivitiesCard activities={dashboard.recentActivities} />
          <ReserveSitesCard sites={dashboard.reserveSites} />
        </section>
      ) : null}

      {panels.fleet ? (
        <section>
          <FleetPerformanceCard fleets={dashboard.fleets} />
        </section>
      ) : null}
    </Main>
  )
}

type DashboardDetailId = 'transported' | 'reserve' | 'delivered' | 'alerts'

/**
 * Which dashboard panels are relevant to a role. SUPERADMIN/ADMIN see the full
 * national view; operational roles see only the panels that concern them.
 */
function rolePanelVisibility(role?: Role) {
  switch (role) {
    case 'SUPERADMIN':
    case 'ADMIN':
      return { flow: true, recent: true, fleet: true }
    case 'SUPERVISOR':
    case 'INTEGRATEUR':
      return { flow: false, recent: true, fleet: false }
    case 'MARKETEUR':
    case 'TRANSPORTEUR':
    case 'AGENT':
    case 'LIVREUR':
      return { flow: true, recent: true, fleet: true }
    default:
      return { flow: true, recent: true, fleet: true }
  }
}

const activityStatusClasses: Record<DashboardActivityStatus, string> = {
  completed:
    'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  attention:
    'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  planned:
    'border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300',
}

const reserveStatusClasses = {
  healthy:
    'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  watch:
    'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  critical:
    'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300',
} as const

const routeStatusLabels: Record<DashboardRouteContribution['status'], string> =
  {
    planned: 'Planifiée',
    'in-progress': 'En cours',
    completed: 'Terminée',
    incident: 'Incident',
  }

function MetricCard({
  metric,
  sparkline,
  selected,
  onSelect,
}: {
  metric: DashboardMetric
  sparkline: number[] | null
  selected: boolean
  onSelect: () => void
}) {
  const DeltaIcon =
    metric.deltaDirection === 'down' ? ArrowDownRight : ArrowUpRight

  return (
    <Card
      className={cn(
        'flex h-full flex-col rounded-2xl border-border/60 shadow-none transition-colors',
        selected && 'border-primary/30 bg-primary/[0.03] ring-1 ring-primary/15'
      )}
    >
      <CardHeader className='gap-3 pb-3'>
        <div className='flex items-center justify-between gap-3'>
          <div className='flex size-10 items-center justify-center rounded-xl border bg-muted/30'>
            <div className='size-4 rounded-full bg-primary/20' />
          </div>
          {metric.id === 'alerts' ? (
            <Badge className='border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'>
              {metric.highlight}
            </Badge>
          ) : null}
        </div>
        <div className='space-y-1'>
          <CardTitle className='text-base font-medium'>
            {metric.title}
          </CardTitle>
          <CardDescription>{metric.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-3'>
        <div className='flex items-end justify-between gap-3'>
          <p className='text-4xl font-semibold tracking-tight'>
            {formatMetricValue(metric.value, metric.unit)}
          </p>
          {metric.id !== 'alerts' ? (
            <Badge
              variant='outline'
              className='border-transparent bg-muted/40 text-foreground'
            >
              {metric.highlight}
            </Badge>
          ) : null}
        </div>

        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <DeltaIcon className='size-4' />
          <span>{signedPercent(metric.deltaPercent)}</span>
          <span>vs la période précédente</span>
        </div>

        {sparkline ? (
          <div className='flex h-12 items-end gap-1 pt-1'>
            {sparkline.map((value, index) => (
              <div
                key={`${metric.id}-${index}`}
                className='flex-1 rounded-t-sm bg-primary/85'
                style={{
                  height: `${Math.max(value * 18, 16)}%`,
                }}
              />
            ))}
          </div>
        ) : null}

        <Button
          type='button'
          variant='ghost'
          className='mt-auto h-9 w-full justify-between rounded-xl bg-muted/35 px-3 shadow-none hover:bg-muted/55 dark:bg-white/5 dark:hover:bg-white/10'
          onClick={onSelect}
        >
          Voir détails
          <ChevronRight className='size-4 text-muted-foreground' />
        </Button>
      </CardContent>
    </Card>
  )
}

function MetricDetailsPanel({
  activeMetricId,
  routeContributions,
  fleets,
  reserveSites,
  alerts,
}: {
  activeMetricId: DashboardDetailId
  routeContributions: DashboardRouteContribution[]
  fleets: DashboardFleetSummary[]
  reserveSites: DashboardReserveSite[]
  alerts: {
    id: string
    severity: string
    title: string
    description: string
    scope: string
    owner: string
    metricValue: string
  }[]
}) {
  const copy = getDetailsCopy(activeMetricId)

  return (
    <Card className='rounded-2xl border-border/60 shadow-none'>
      <CardHeader className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='space-y-1'>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </div>
        <Badge
          variant='outline'
          className='w-fit border-transparent bg-muted/40 text-foreground'
        >
          {copy.badge}
        </Badge>
      </CardHeader>
      <CardContent>
        {activeMetricId === 'transported' || activeMetricId === 'delivered' ? (
          <div className='grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]'>
            <CarrierSummaryList fleets={fleets} />
            <RouteContributionTable
              contributions={routeContributions}
              mode={activeMetricId}
            />
          </div>
        ) : null}

        {activeMetricId === 'reserve' ? (
          <ReserveDetailTable sites={reserveSites} />
        ) : null}

        {activeMetricId === 'alerts' ? (
          <AlertDetailList alerts={alerts} />
        ) : null}
      </CardContent>
    </Card>
  )
}

function CarrierSummaryList({ fleets }: { fleets: DashboardFleetSummary[] }) {
  return (
    <div className='space-y-3 rounded-xl border border-border/60 p-4'>
      <div>
        <p className='text-sm font-medium'>Contribution par transporteur</p>
        <p className='text-xs text-muted-foreground'>
          Lecture consolidée des volumes chargés et livrés.
        </p>
      </div>

      <div className='space-y-3'>
        {fleets.map((fleet) => (
          <div key={fleet.fleetName} className='space-y-2'>
            <div className='flex items-center justify-between gap-3 text-sm'>
              <div className='flex min-w-0 items-center gap-2'>
                <span
                  className='size-2.5 shrink-0 rounded-full'
                  style={{ backgroundColor: fleet.color }}
                />
                <span className='truncate font-medium'>{fleet.fleetName}</span>
              </div>
              <span className='text-muted-foreground'>
                {fleet.sharePercent}%
              </span>
            </div>
            <div className='h-2 rounded-full bg-muted/40'>
              <div
                className='h-full rounded-full'
                style={{
                  width: `${fleet.sharePercent}%`,
                  backgroundColor: fleet.color,
                }}
              />
            </div>
            <div className='grid grid-cols-2 gap-2 text-xs text-muted-foreground'>
              <span>{formatTm(fleet.transportedTM)} chargés</span>
              <span className='text-right'>
                {formatTm(fleet.delivered)} livrés
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RouteContributionTable({
  contributions,
  mode,
}: {
  contributions: DashboardRouteContribution[]
  mode: 'transported' | 'delivered'
}) {
  const rows = [...contributions]
    .filter((contribution) =>
      mode === 'delivered' ? contribution.deliveredQuantity > 0 : true
    )
    .sort((left, right) => {
      const leftValue =
        mode === 'delivered' ? left.deliveredQuantity : left.loadedQuantity
      const rightValue =
        mode === 'delivered'
          ? right.deliveredQuantity
          : right.loadedQuantity

      return rightValue - leftValue
    })

  return (
    <div className='overflow-x-auto rounded-xl border border-border/60'>
      <table className='w-full min-w-[760px] text-sm'>
        <thead className='bg-muted/30 text-xs text-muted-foreground'>
          <tr>
            <th className='px-4 py-3 text-left font-medium'>Mission</th>
            <th className='px-4 py-3 text-left font-medium'>Transporteur</th>
            <th className='px-4 py-3 text-left font-medium'>Camion</th>
            <th className='px-4 py-3 text-right font-medium'>
              {mode === 'delivered' ? 'Livré' : 'Chargé'}
            </th>
            <th className='px-4 py-3 text-right font-medium'>Reste</th>
            <th className='px-4 py-3 text-left font-medium'>Responsable</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-border/60'>
          {rows.map((contribution) => {
            const volume =
              mode === 'delivered'
                ? contribution.deliveredQuantity
                : contribution.loadedQuantity
            const share =
              mode === 'delivered'
                ? contribution.deliveredSharePercent
                : contribution.transportedSharePercent

            return (
              <tr key={contribution.id} className='bg-background'>
                <td className='px-4 py-3 align-top'>
                  <p className='font-medium'>{contribution.reference}</p>
                  <p className='text-xs text-muted-foreground'>
                    {contribution.originLabel} - {contribution.destinationLabel}
                  </p>
                </td>
                <td className='px-4 py-3 align-top'>
                  <p className='font-medium'>{contribution.carrierName}</p>
                  <p className='text-xs text-muted-foreground'>
                    {contribution.customerName}
                  </p>
                </td>
                <td className='px-4 py-3 align-top'>
                  <p className='font-medium'>{contribution.plateNumber}</p>
                  <p className='text-xs text-muted-foreground'>
                    {contribution.driverName}
                  </p>
                </td>
                <td className='px-4 py-3 text-right align-top'>
                  <p className='font-medium'>{formatTm(volume)}</p>
                  <p className='text-xs text-muted-foreground'>
                    {share}% du total
                  </p>
                </td>
                <td className='px-4 py-3 text-right align-top'>
                  <p className='font-medium'>
                    {formatTm(contribution.remainingQuantity)}
                  </p>
                  {contribution.unaccounted > 0 ? (
                    <p className='text-xs text-rose-600 dark:text-rose-300'>
                      {formatTm(contribution.unaccounted)} à vérifier
                    </p>
                  ) : (
                    <p className='text-xs text-muted-foreground'>
                      {routeStatusLabels[contribution.status]}
                    </p>
                  )}
                </td>
                <td className='px-4 py-3 align-top'>
                  <p className='font-medium'>{contribution.missionLead}</p>
                  <p className='text-xs text-muted-foreground'>
                    {contribution.onTime ? 'ETA tenue' : 'ETA à suivre'}
                  </p>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ReserveDetailTable({ sites }: { sites: DashboardReserveSite[] }) {
  return (
    <div className='overflow-x-auto rounded-xl border border-border/60'>
      <table className='w-full min-w-[720px] text-sm'>
        <thead className='bg-muted/30 text-xs text-muted-foreground'>
          <tr>
            <th className='px-4 py-3 text-left font-medium'>Site</th>
            <th className='px-4 py-3 text-left font-medium'>Opérateur</th>
            <th className='px-4 py-3 text-right font-medium'>Réserve</th>
            <th className='px-4 py-3 text-right font-medium'>Couverture</th>
            <th className='px-4 py-3 text-right font-medium'>Inbound prévu</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-border/60'>
          {sites.map((site) => (
            <tr key={site.siteId} className='bg-background'>
              <td className='px-4 py-3'>
                <p className='font-medium'>{site.siteName}</p>
                <p className='text-xs text-muted-foreground'>{site.city}</p>
              </td>
              <td className='px-4 py-3'>
                <p className='font-medium'>{site.operator}</p>
                <p className='text-xs text-muted-foreground'>
                  Seuil cible {site.targetMinPercent}%
                </p>
              </td>
              <td className='px-4 py-3 text-right'>
                <p className='font-medium'>{formatTm(site.reserveTM)}</p>
                <p className='text-xs text-muted-foreground'>
                  {site.fillPercent}% rempli
                </p>
              </td>
              <td className='px-4 py-3 text-right'>
                <p className='font-medium'>
                  {site.daysOfCover.toFixed(1)} jours
                </p>
                <p className='text-xs text-muted-foreground'>
                  {site.activeTripCount} mission
                  {site.activeTripCount > 1 ? 's' : ''}
                </p>
              </td>
              <td className='px-4 py-3 text-right'>
                <p className='font-medium'>{formatTm(site.scheduledInboundTM)}</p>
                <p className='text-xs text-muted-foreground'>
                  sorties {formatTm(site.outboundTM)}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AlertDetailList({
  alerts,
}: {
  alerts: {
    id: string
    severity: string
    title: string
    description: string
    scope: string
    owner: string
    metricValue: string
  }[]
}) {
  return (
    <div className='grid gap-3 md:grid-cols-2'>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className='rounded-xl border border-border/60 bg-background p-4'
        >
          <div className='flex items-start justify-between gap-3'>
            <div className='space-y-1'>
              <p className='font-medium'>{alert.title}</p>
              <p className='text-sm text-muted-foreground'>{alert.description}</p>
            </div>
            <Badge
              className={cn(
                'shrink-0',
                alert.severity === 'high'
                  ? 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                  : 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
              )}
            >
              {alert.severity === 'high' ? 'Critique' : 'A suivre'}
            </Badge>
          </div>
          <div className='mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3'>
            <span>{alert.scope}</span>
            <span>{alert.owner}</span>
            <span className='sm:text-right'>{alert.metricValue}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function getDetailsCopy(activeMetricId: DashboardDetailId) {
  if (activeMetricId === 'transported') {
    return {
      title: 'Détails des volumes transportés',
      description:
        'Lecture par mission, transporteur, camion et responsable opérationnel.',
      badge: 'Traçabilité mission',
    }
  }

  if (activeMetricId === 'delivered') {
    return {
      title: 'Détails des flux livrés',
      description:
        'Volumes confirmés par transporteur avec mission et camion associés.',
      badge: 'Livraisons confirmées',
    }
  }

  if (activeMetricId === 'reserve') {
    return {
      title: 'Détails de la réserve utile',
      description:
        'Stock disponible, couverture et inbound prévu sur les sites sensibles.',
      badge: 'Stocks réseau',
    }
  }

  return {
    title: 'Détails des alertes ouvertes',
    description:
      'Priorités terrain, responsables et métriques à traiter rapidement.',
    badge: 'Exploitation',
  }
}

function FlowBreakdownCard({
  totalTransportedTM,
  breakdown,
  deltaPercent,
}: {
  totalTransportedTM: number
  breakdown: DashboardBreakdownItem[]
  deltaPercent: number
}) {
  return (
    <Card className='rounded-2xl border-border/60 shadow-none'>
      <CardHeader>
        <CardTitle>Répartition des flux</CardTitle>
        <CardDescription>
          Vue par flotte sur le volume de GPL actuellement engagé.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='space-y-2'>
          <p className='text-sm text-muted-foreground'>Volume transporté</p>
          <p className='text-4xl font-semibold tracking-tight'>
            {formatTm(totalTransportedTM)}
          </p>
          <p className='flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-300'>
            <ArrowUpRight className='size-4' />
            {signedPercent(deltaPercent)} comparé au dernier cycle
          </p>
        </div>

        <div className='flex h-3 overflow-hidden rounded-full bg-muted/40'>
          {breakdown.map((item) => (
            <div
              key={item.id}
              style={{
                width: `${item.sharePercent}%`,
                backgroundColor: item.color,
              }}
            />
          ))}
        </div>

        <div className='space-y-3'>
          {breakdown.map((item) => (
            <div
              key={item.id}
              className='flex items-center justify-between gap-3 text-sm'
            >
              <div className='flex items-center gap-3'>
                <span
                  className='size-2.5 rounded-full'
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <p className='font-medium'>{item.label}</p>
                  <p className='text-xs text-muted-foreground'>
                    {item.sharePercent}% du portefeuille
                  </p>
                </div>
              </div>
              <p className='font-medium'>{formatTm(item.amountTM)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function MonthlyVolumesCard({
  series,
}: {
  series: { label: string; transportedTM: number; delivered: number }[]
}) {
  return (
    <Card className='rounded-2xl border-border/60 shadow-none'>
      <CardHeader className='flex flex-row items-start justify-between gap-3 space-y-0'>
        <div className='space-y-1'>
          <CardTitle>Volumes mensuels</CardTitle>
          <CardDescription>6 derniers mois</CardDescription>
        </div>
        <Button
          type='button'
          variant='outline'
          className='h-9 rounded-xl bg-background shadow-none'
        >
          Voir rapport
        </Button>
      </CardHeader>
      <CardContent className='space-y-5'>
        <div className='h-[290px]'>
          <ResponsiveContainer width='100%' aspect={16 / 9}>
            <BarChart data={series} barCategoryGap={18}>
              <CartesianGrid
                stroke='rgba(148, 163, 184, 0.18)'
                strokeDasharray='4 6'
                vertical={false}
              />
              <XAxis
                dataKey='label'
                tickLine={false}
                axisLine={false}
                fontSize={12}
              />
              <YAxis
                tickFormatter={(value) => formatTm(Number(value))}
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={48}
              />
              <Tooltip
                content={({ active, label, payload }) => {
                  if (!active || !payload || payload.length === 0) return null

                  const transported = Number(
                    payload.find((item) => item.name === 'Transporte')?.value ??
                      0
                  )
                  const delivered = Number(
                    payload.find((item) => item.name === 'Livré')?.value ?? 0
                  )

                  return (
                    <div className='rounded-xl border bg-background px-3 py-2 shadow-sm'>
                      <p className='text-xs text-muted-foreground'>{label}</p>
                      <div className='mt-2 space-y-1 text-sm'>
                        <p>Transporté: {formatTm(transported)}</p>
                        <p className='text-muted-foreground'>
                          Livré: {formatTm(delivered)}
                        </p>
                      </div>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey='transportedTM'
                name='Transporté'
                fill='var(--color-primary)'
                radius={[10, 10, 0, 0]}
              />
              <Bar
                dataKey='delivered'
                name='Livré'
                fill='#93c5fd'
                radius={[10, 10, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className='space-y-1 text-sm'>
          <p className='flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-300'>
            <ArrowUpRight className='size-4' />
            Tendance positive sur les flux livrés.
          </p>
          <p className='text-muted-foreground'>
            La cadence reste principalement tirée par Douala et Bipaga.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function ReserveSummaryCard({
  totalReserveTM,
  summary,
}: {
  totalReserveTM: number
  summary: DashboardBreakdownItem[]
}) {
  return (
    <Card className='rounded-2xl border-border/60 shadow-none'>
      <CardHeader className='flex flex-row items-start justify-between gap-3 space-y-0'>
        <div className='space-y-1'>
          <CardTitle>Synthèse réserve</CardTitle>
          <CardDescription>Lecture globale du stock utile</CardDescription>
        </div>
        <Badge
          variant='outline'
          className='border-transparent bg-muted/40 text-foreground'
        >
          {formatTm(totalReserveTM)}
        </Badge>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='relative mx-auto h-[220px] w-full max-w-[240px]'>
          <ResponsiveContainer width='100%' aspect={16 / 9}>
            <PieChart>
              <Pie
                data={summary}
                dataKey='amountTM'
                innerRadius={60}
                outerRadius={92}
                paddingAngle={3}
                strokeWidth={0}
              >
                {summary.map((item) => (
                  <Cell key={item.id} fill={item.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null

                  const item = payload[0]?.payload as DashboardBreakdownItem

                  return (
                    <div className='rounded-xl border bg-background px-3 py-2 shadow-sm'>
                      <p className='text-sm font-medium'>{item.label}</p>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {formatTm(item.amountTM)} - {item.sharePercent}%
                      </p>
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center'>
            <p className='text-xs tracking-[0.18em] text-muted-foreground uppercase'>
              Réserve utile
            </p>
            <p className='text-3xl font-semibold'>{formatTm(totalReserveTM)}</p>
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-2'>
          {summary.map((item) => (
            <div
              key={item.id}
              className='flex items-center justify-between gap-3 rounded-xl bg-muted/25 px-3 py-3 text-sm'
            >
              <div className='flex items-center gap-2'>
                <span
                  className='size-2.5 rounded-full'
                  style={{ backgroundColor: item.color }}
                />
                <span className='font-medium'>{item.label}</span>
              </div>
              <span className='text-muted-foreground'>{item.sharePercent}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RecentActivitiesCard({
  activities,
}: {
  activities: DashboardRecentActivity[]
}) {
  return (
    <Card className='rounded-2xl border-border/60 shadow-none'>
      <CardHeader className='flex flex-row items-start justify-between gap-3 space-y-0'>
        <div className='space-y-1'>
          <CardTitle>Activités récentes</CardTitle>
          <CardDescription>
            Les derniers mouvements qui impactent la lecture du réseau.
          </CardDescription>
        </div>
        <Button
          type='button'
          variant='outline'
          className='h-9 rounded-xl bg-background shadow-none'
        >
          Voir tout
        </Button>
      </CardHeader>
      <CardContent className='space-y-4'>
        {activities.map((activity) => (
          <div
            key={activity.id}
            className='flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-background px-4 py-4'
          >
            <div className='space-y-1.5'>
              <div className='flex flex-wrap items-center gap-2'>
                <p className='font-medium'>{activity.title}</p>
                <Badge className={activityStatusClasses[activity.status]}>
                  {activity.status === 'completed'
                    ? 'Confirmé'
                    : activity.status === 'attention'
                      ? 'Attention'
                      : 'Planifié'}
                </Badge>
              </div>
              <p className='text-sm text-muted-foreground'>{activity.description}</p>
              <div className='flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
                <span>{activity.location}</span>
                <span>{activity.owner}</span>
                <span>{formatActivityDate(activity.happenedAt)}</span>
              </div>
            </div>

            <div className='text-right'>
              <p className='text-sm font-medium'>
                {activity.volumeTM ? formatTm(activity.volumeTM) : '--'}
              </p>
              <p className='mt-1 text-xs text-muted-foreground'>impact estimé</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ReserveSitesCard({ sites }: { sites: DashboardReserveSite[] }) {
  return (
    <Card className='rounded-2xl border-border/60 shadow-none'>
      <CardHeader>
        <CardTitle>Réserve par site</CardTitle>
        <CardDescription>
          Niveau de couverture et flux attendus sur les points sensibles.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {sites.map((site) => (
          <div
            key={site.siteId}
            className='rounded-2xl border border-border/60 bg-background px-4 py-4'
          >
            <div className='flex items-start justify-between gap-3'>
              <div className='space-y-1'>
                <div className='flex flex-wrap items-center gap-2'>
                  <p className='font-medium'>{site.siteName}</p>
                  <Badge className={reserveStatusClasses[site.status]}>
                    {site.status === 'critical'
                      ? 'Critique'
                      : site.status === 'watch'
                        ? 'A surveiller'
                        : 'Sain'}
                  </Badge>
                </div>
                <p className='text-sm text-muted-foreground'>
                  {site.city} - {site.operator}
                </p>
              </div>
              <div className='text-right'>
                <p className='text-sm font-medium'>{formatTm(site.reserveTM)}</p>
                <p className='text-xs text-muted-foreground'>
                  {site.daysOfCover.toFixed(1)} jours
                </p>
              </div>
            </div>

            <div className='mt-4 h-2.5 rounded-full bg-muted/40'>
              <div
                className={cn(
                  'h-full rounded-full',
                  site.status === 'critical'
                    ? 'bg-rose-500'
                    : site.status === 'watch'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                )}
                style={{ width: `${site.fillPercent}%` }}
              />
            </div>

            <div className='mt-4 grid gap-3 sm:grid-cols-3'>
              <MiniStat label='Remplissage' value={`${site.fillPercent}%`} />
              <MiniStat
                label='Inbound prévu'
                value={formatTm(site.scheduledInboundTM)}
              />
              <MiniStat label='Sorties' value={formatTm(site.outboundTM)} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function FleetPerformanceCard({ fleets }: { fleets: DashboardFleetSummary[] }) {
  return (
    <Card className='rounded-2xl border-border/60 shadow-none'>
      <CardHeader>
        <CardTitle>Performance des flottes</CardTitle>
        <CardDescription>
          Contribution, niveau de mobilisation et qualité de service par
          entreprise.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {fleets.map((fleet) => (
          <div
            key={fleet.fleetName}
            className='rounded-2xl border border-border/60 bg-background px-4 py-4'
          >
            <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
              <div className='space-y-1.5'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span
                    className='size-2.5 rounded-full'
                    style={{ backgroundColor: fleet.color }}
                  />
                  <p className='font-medium'>{fleet.fleetName}</p>
                  <Badge
                    variant='outline'
                    className='border-transparent bg-muted/40 text-foreground'
                  >
                    {fleet.sharePercent}% du volume
                  </Badge>
                </div>
                <p className='text-sm text-muted-foreground'>
                  {fleet.activeTruckCount}/{fleet.truckCount} camions actifs -{' '}
                  {fleet.activeTripCount} mission
                  {fleet.activeTripCount > 1 ? 's' : ''} ouvertes
                </p>
              </div>
              <div className='text-right'>
                <p className='text-lg font-semibold'>{formatTm(fleet.transportedTM)}</p>
                <p className='text-xs text-muted-foreground'>
                  {fleet.onTimeRate}% de service
                </p>
              </div>
            </div>

            <div className='mt-4 grid gap-3 sm:grid-cols-4'>
              <MiniStat label='Livré' value={formatTm(fleet.delivered)} />
              <MiniStat label='En attente' value={formatTm(fleet.pendingTM)} />
              <MiniStat
                label='Mobilisation'
                value={`${fleet.utilizationPercent}%`}
              />
              <MiniStat
                label='Risque'
                value={`${fleet.riskTruckCount} camion${fleet.riskTruckCount > 1 ? 's' : ''}`}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function SecondaryKpiStrip({
  dashboard,
}: {
  dashboard: ReturnType<typeof buildDashboardView>
}) {
  const utilization = dashboard.overview.totalTrucks
    ? Math.round((dashboard.overview.activeTrucks / dashboard.overview.totalTrucks) * 100)
    : 0
  const activePeriod =
    (dashboard.query?.period as DashboardPeriod | undefined) ?? 'daily'
  const serviceRate =
    dashboard.trendByPeriod[activePeriod]?.[dashboard.trendByPeriod[activePeriod].length - 1]?.serviceRate ?? 0

  const items = [
    {
      label: 'Couverture réserve',
      value: `${dashboard.overview.reserveCoverageDays.toFixed(1)} jours`,
      subValue: `${dashboard.overview.reserveFillPercent}% remplissage`,
      icon: Droplets,
      tone: dashboard.overview.reserveFillPercent < 35 ? 'rose' : 'emerald',
    },
    {
      label: 'Mobilisation flotte',
      value: `${utilization}%`,
      subValue: `${dashboard.overview.activeTrucks}/${dashboard.overview.totalTrucks} camions actifs`,
      icon: Truck,
      tone: 'sky',
    },
    {
      label: 'Taux de service',
      value: `${serviceRate}%`,
      subValue: `Période: ${activePeriod}`,
      icon: Gauge,
      tone: serviceRate < 75 ? 'amber' : 'emerald',
    },
    {
      label: 'Écarts & risques',
      value: `${dashboard.overview.criticalAlerts} critiques`,
      subValue: `${dashboard.overview.openAlerts} alertes • ${formatTm(dashboard.overview.abnormalLossTM)} écart`,
      icon: ShieldAlert,
      tone: dashboard.overview.criticalAlerts > 0 ? 'rose' : 'emerald',
    },
  ] as const

  return (
    <section className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
      {items.map((item) => (
        <div
          key={item.label}
          className='flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-none'
        >
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl border',
              item.tone === 'rose' && 'bg-rose-500/10 border-rose-500/20 text-rose-600',
              item.tone === 'emerald' && 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
              item.tone === 'sky' && 'bg-sky-500/10 border-sky-500/20 text-sky-600',
              item.tone === 'amber' && 'bg-amber-500/10 border-amber-500/20 text-amber-600'
            )}
          >
            <item.icon className='size-4' />
          </div>
          <div className='min-w-0'>
            <p className='text-xs tracking-[0.12em] text-muted-foreground uppercase'>{item.label}</p>
            <p className='truncate text-sm font-semibold'>{item.value}</p>
            <p className='truncate text-xs text-muted-foreground'>{item.subValue}</p>
          </div>
        </div>
      ))}
    </section>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-xl bg-muted/25 px-3 py-3 text-sm'>
      <p className='text-xs tracking-[0.16em] text-muted-foreground uppercase'>
        {label}
      </p>
      <p className='mt-2 font-medium'>{value}</p>
    </div>
  )
}

function formatMetricValue(
  value: number,
  unit: 'TM' | 'btl' | 'count' | 'percent' | 'days'
) {
  if (unit === 'TM') return formatTm(value)
  if (unit === 'btl') return formatBtl(value)
  if (unit === 'percent') return `${value}%`
  if (unit === 'days') return `${value.toFixed(1)} jours`
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value)
}

function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function signedPercent(value: number) {
  if (value > 0) return `+${value}%`
  if (value < 0) return `${value}%`
  return '0%'
}
