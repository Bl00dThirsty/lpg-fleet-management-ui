import { type ElementType, useMemo } from 'react'
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  PackageCheck,
  Truck,
  Warehouse,
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
import { Main } from '@/components/layout/main'
import {
  buildDashboardView,
  type DashboardActivityStatus,
  type DashboardBreakdownItem,
  type DashboardFleetSummary,
  type DashboardMetric,
  type DashboardRecentActivity,
  type DashboardReserveSite,
} from './data/dashboard'

const metricIcons: Record<string, ElementType> = {
  transported: Truck,
  reserve: Warehouse,
  delivered: PackageCheck,
  alerts: AlertTriangle,
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

export function DashboardPage() {
  const dashboard = useMemo(() => buildDashboardView(), [])
  const monthlySeries = dashboard.trendByPeriod.monthly
  const dailyAlerts = dashboard.trendByPeriod.daily

  return (
    <Main fluid className='space-y-6 bg-muted/20'>
      <section className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='space-y-1'>
          <h1 className='font-manrope text-3xl font-semibold tracking-tight'>
            Tableau de bord global
          </h1>
          <p className='max-w-3xl text-sm text-muted-foreground sm:text-base'>
            Pilotage consolide des volumes transportes, de la reserve utile et
            des signaux recents du reseau GPL.
          </p>
        </div>

        <div className='flex flex-wrap gap-2'>
          <Button
            type='button'
            variant='outline'
            className='h-10 rounded-xl bg-background shadow-none'
          >
            <CalendarRange className='size-4' />
            {dashboard.overview.dateRangeLabel}
          </Button>
          <Button type='button' size='icon' className='h-10 w-10 rounded-xl'>
            <ArrowDownToLine className='size-4' />
            <span className='sr-only'>Exporter</span>
          </Button>
        </div>
      </section>

      <section className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {dashboard.metrics.map((metric) => (
          <MetricCard
            key={metric.id}
            metric={metric}
            sparkline={
              metric.id === 'alerts'
                ? dailyAlerts.map((item) => item.alertCount)
                : null
            }
          />
        ))}
      </section>

      <section className='grid gap-4 xl:grid-cols-[1.05fr_1fr_0.95fr]'>
        <FlowBreakdownCard
          totalTransportedKg={dashboard.overview.totalTransportedKg}
          breakdown={dashboard.flowBreakdown}
          deltaPercent={dashboard.metrics[0]?.deltaPercent ?? 0}
        />

        <MonthlyVolumesCard series={monthlySeries} />

        <ReserveSummaryCard
          totalReserveKg={dashboard.overview.totalReserveKg}
          summary={dashboard.reserveSummary}
        />
      </section>

      <section className='grid gap-4 xl:grid-cols-[1.15fr_0.85fr]'>
        <RecentActivitiesCard activities={dashboard.recentActivities} />
        <ReserveSitesCard sites={dashboard.reserveSites} />
      </section>

      <section>
        <FleetPerformanceCard fleets={dashboard.fleets} />
      </section>
    </Main>
  )
}

function MetricCard({
  metric,
  sparkline,
}: {
  metric: DashboardMetric
  sparkline: number[] | null
}) {
  const Icon = metricIcons[metric.id] ?? Truck
  const DeltaIcon =
    metric.deltaDirection === 'down' ? ArrowDownRight : ArrowUpRight

  return (
    <Card className='rounded-2xl border-border/60 shadow-none'>
      <CardHeader className='gap-3 pb-3'>
        <div className='flex items-center justify-between gap-3'>
          <div className='flex size-10 items-center justify-center rounded-xl border bg-muted/30'>
            <Icon className='size-4 text-muted-foreground' />
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
      <CardContent className='space-y-3'>
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
          <span>vs la periode precedente</span>
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
      </CardContent>
    </Card>
  )
}

function FlowBreakdownCard({
  totalTransportedKg,
  breakdown,
  deltaPercent,
}: {
  totalTransportedKg: number
  breakdown: DashboardBreakdownItem[]
  deltaPercent: number
}) {
  return (
    <Card className='rounded-2xl border-border/60 shadow-none'>
      <CardHeader>
        <CardTitle>Répartition des flux</CardTitle>
        <CardDescription>
          Vue par flotte sur le volume de GPL actuellement engage.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='space-y-2'>
          <p className='text-sm text-muted-foreground'>Volume transporté</p>
          <p className='text-4xl font-semibold tracking-tight'>
            {formatKg(totalTransportedKg)}
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
              <p className='font-medium'>{formatKg(item.amountKg)}</p>
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
  series: { label: string; transportedKg: number; deliveredKg: number }[]
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
          <ResponsiveContainer width='100%' height='100%'>
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
                tickFormatter={(value) => formatAxisKg(Number(value))}
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
                    payload.find((item) => item.name === 'Livre')?.value ?? 0
                  )

                  return (
                    <div className='rounded-xl border bg-background px-3 py-2 shadow-sm'>
                      <p className='text-xs text-muted-foreground'>{label}</p>
                      <div className='mt-2 space-y-1 text-sm'>
                        <p>Transporte: {formatKg(transported)}</p>
                        <p className='text-muted-foreground'>
                          Livre: {formatKg(delivered)}
                        </p>
                      </div>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey='transportedKg'
                name='Transporte'
                fill='var(--color-primary)'
                radius={[10, 10, 0, 0]}
              />
              <Bar
                dataKey='deliveredKg'
                name='Livre'
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
  totalReserveKg,
  summary,
}: {
  totalReserveKg: number
  summary: DashboardBreakdownItem[]
}) {
  return (
    <Card className='rounded-2xl border-border/60 shadow-none'>
      <CardHeader className='flex flex-row items-start justify-between gap-3 space-y-0'>
        <div className='space-y-1'>
          <CardTitle>Synthèse reserve</CardTitle>
          <CardDescription>Lecture globale du stock utile</CardDescription>
        </div>
        <Badge
          variant='outline'
          className='border-transparent bg-muted/40 text-foreground'
        >
          {formatTons(totalReserveKg)}
        </Badge>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='relative mx-auto h-[220px] w-full max-w-[240px]'>
          <ResponsiveContainer width='100%' height='100%'>
            <PieChart>
              <Pie
                data={summary}
                dataKey='amountKg'
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
                        {formatKg(item.amountKg)} - {item.sharePercent}%
                      </p>
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center'>
            <p className='text-xs tracking-[0.18em] text-muted-foreground uppercase'>
              Reserve utile
            </p>
            <p className='text-3xl font-semibold'>
              {formatTons(totalReserveKg)}
            </p>
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
              <span className='text-muted-foreground'>
                {item.sharePercent}%
              </span>
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
          <CardTitle>Activités recentes</CardTitle>
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
                    ? 'Confirme'
                    : activity.status === 'attention'
                      ? 'Attention'
                      : 'Planifie'}
                </Badge>
              </div>
              <p className='text-sm text-muted-foreground'>
                {activity.description}
              </p>
              <div className='flex flex-wrap items-center gap-3 text-xs text-muted-foreground'>
                <span>{activity.location}</span>
                <span>{activity.owner}</span>
                <span>{formatActivityDate(activity.happenedAt)}</span>
              </div>
            </div>

            <div className='text-right'>
              <p className='text-sm font-medium'>
                {activity.volumeKg ? formatKg(activity.volumeKg) : '--'}
              </p>
              <p className='mt-1 text-xs text-muted-foreground'>
                impact estimé
              </p>
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
                <p className='text-sm font-medium'>
                  {formatKg(site.reserveKg)}
                </p>
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
                label='Inbound prevu'
                value={formatKg(site.scheduledInboundKg)}
              />
              <MiniStat label='Sorties' value={formatKg(site.outboundKg)} />
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
                <p className='text-lg font-semibold'>
                  {formatKg(fleet.transportedKg)}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {fleet.onTimeRate}% de service
                </p>
              </div>
            </div>

            <div className='mt-4 grid gap-3 sm:grid-cols-4'>
              <MiniStat label='Livre' value={formatKg(fleet.deliveredKg)} />
              <MiniStat label='En attente' value={formatKg(fleet.pendingKg)} />
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

function formatKg(value: number) {
  return `${new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value)} kg`
}

function formatTons(value: number) {
  return `${new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 1000)} t`
}

function formatMetricValue(
  value: number,
  unit: 'kg' | 'count' | 'percent' | 'days'
) {
  if (unit === 'kg') return formatKg(value)
  if (unit === 'percent') return `${value}%`
  if (unit === 'days') return `${value.toFixed(1)} jours`
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value)
}

function formatAxisKg(value: number) {
  return `${new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value / 1000)}t`
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
