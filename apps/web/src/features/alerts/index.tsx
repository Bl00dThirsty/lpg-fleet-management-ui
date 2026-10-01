import { useMemo } from 'react'
import { AlertTriangle, Gauge, RadioTower } from 'lucide-react'
import { Badge } from '@lpg/ui'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import { getInfraAlertSummary, getInfraAlerts, type InfraAlert } from './data/alerts'

export function AlertsPage() {
  const alerts = useMemo(() => getInfraAlerts(), [])
  const summary = useMemo(() => getInfraAlertSummary(), [])

  return (
    <PageShell>
      <PageHeader
        title='Alertes infrastructure'
        description='Alertes issues des appareils et des anomalies de la plateforme.'
      />

      <div className='grid gap-4 sm:grid-cols-3'>
        <KpiTile label='Alertes' value={String(summary.total)} />
        <KpiTile label='Appareils' value={String(summary.devices)} />
        <KpiTile label='Anomalies' value={String(summary.anomalies)} />
      </div>

      <SectionCard title='File d’alertes' description='Les plus récentes à traiter en priorité.'>
        <div className='space-y-2'>
          {alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </div>
      </SectionCard>
    </PageShell>
  )
}

function AlertRow({ alert }: { alert: InfraAlert }) {
  const Icon = alert.source === 'ANOMALY' ? RadioTower : alert.source === 'DEVICE' ? Gauge : AlertTriangle
  return (
    <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3'>
      <div className='flex min-w-0 items-center gap-2'>
        <Icon className='size-4 shrink-0 text-primary' />
        <div className='min-w-0'>
          <p className='truncate text-sm font-medium'>{alert.title}</p>
          <p className='truncate text-xs text-muted-foreground'>{alert.detail}</p>
        </div>
      </div>
      <div className='flex items-center gap-1.5'>
        <Badge variant='secondary'>{alert.source}</Badge>
        <Badge
          variant={alert.severity === 'CRITIQUE' ? 'destructive' : 'secondary'}
          className={cn(alert.severity !== 'CRITIQUE' && 'text-muted-foreground')}
        >
          {alert.severityLabel}
        </Badge>
      </div>
    </div>
  )
}