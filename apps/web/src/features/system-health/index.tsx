import { useEffect, useMemo, useState } from 'react'
import { Database, HardDrive, HeartPulse, RefreshCw, Server, Zap } from 'lucide-react'
import { Badge } from '@lpg/ui'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { PageShell, SectionCard } from '@/components/layout/page'
import {
  getServiceHealthSummary,
  getSystemHealth,
  type ServiceStatus,
  type SystemServiceHealth,
} from './data/system-health'

const KIND_ICON = {
  database: Database,
  storage: HardDrive,
  api: Server,
  cache: Zap,
  queue: Zap,
  domain: HeartPulse,
} as const

const REFRESH_MS = 15000

export function SystemHealthPage() {
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), REFRESH_MS)
    return () => clearInterval(id)
  }, [])

  const health = useMemo(() => getSystemHealth(), [])
  const summary = useMemo(() => getServiceHealthSummary(), [])

  return (
    <PageShell>
      <PageHeader
        title='Santé système'
        description='État de fonctionnement des services de la plateforme.'
        actions={
          <span className='flex items-center gap-1.5 text-xs text-muted-foreground'>
            <RefreshCw className='size-3.5 animate-spin' style={{ animationDuration: '3s' }} />
            {new Date(health.lastCheckAt).toLocaleTimeString('fr-FR')}
          </span>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Metric
          icon={HeartPulse}
          label='État global'
          value={summary.overallLabel}
          tone={summary.overall}
        />
        <Metric icon={Server} label='Uptime' value={`${summary.uptimePercent}%`} />
        <Metric
          icon={HardDrive}
          label='Services opérationnels'
          value={`${summary.operational}/${summary.total}`}
        />
        <Metric
          icon={Zap}
          label='À surveiller'
          value={String(summary.degraded + summary.critical)}
          tone={summary.degraded + summary.critical > 0 ? 'DEGRADED' : undefined}
        />
      </div>

      <SectionCard
        title='Services'
        description='Métriques dérivées de l’activité réelle (tournées, scans, anomalies, réconciliations), rafraîchies toutes les 15 secondes.'
      >
        <div className='space-y-2'>
          {health.services.map((service) => (
            <ServiceRow key={service.id} service={service} />
          ))}
        </div>
      </SectionCard>
    </PageShell>
  )
}

function ServiceRow({ service }: { service: SystemServiceHealth }) {
  const Icon = KIND_ICON[service.kind] ?? HeartPulse
  return (
    <div className='rounded-lg border p-3'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex min-w-0 items-center gap-2'>
          <Icon className='size-4 shrink-0 text-primary' />
          <div className='min-w-0'>
            <p className='text-sm font-medium'>{service.name}</p>
            <p className='truncate text-xs text-muted-foreground'>{service.detail}</p>
          </div>
        </div>
        <ServiceStatusBadge status={service.status} label={service.statusLabel} />
      </div>
      <div className='mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3'>
        {service.metrics.map((m) => (
          <div key={m.label} className='rounded-md bg-muted/40 px-2.5 py-1.5'>
            <p className='text-[10px] uppercase tracking-wide text-muted-foreground'>{m.label}</p>
            <p className='text-sm font-medium tabular-nums'>{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ServiceStatusBadge({ status, label }: { status: ServiceStatus; label: string }) {
  return (
    <Badge
      variant={status === 'DEGRADED' ? 'secondary' : 'default'}
      className={cn(
        status === 'OPERATIONAL' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        status === 'DEGRADED' && 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
        status === 'CRITICAL' && 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
      )}
    >
      {label}
    </Badge>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType
  label: string
  value: string
  tone?: ServiceStatus
}) {
  return (
    <div className='surface-card p-5'>
      <div className='flex items-center gap-2'>
        <Icon className='size-4 text-primary' />
        <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>{label}</p>
      </div>
      <p
        className={cn(
          'mt-2 text-3xl font-bold tracking-tight',
          tone === 'DEGRADED' && 'text-amber-600 dark:text-amber-400',
          tone === 'CRITICAL' && 'text-rose-600 dark:text-rose-400',
        )}
      >
        {value}
      </p>
    </div>
  )
}