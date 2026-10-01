import { useMemo, useState } from 'react'
import { BellRing } from 'lucide-react'
import { Badge } from '@lpg/ui'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/layout/page-header'
import { KpiTile, PageShell, SectionCard } from '@/components/layout/page'
import {
  getActiveAlertRuleCount,
  getAlertRules,
  getAnomalyTypeCount,
  alertSeverityLabels,
  type AlertRuleView,
} from './data/alert-rules'

export function AlertRulesPage() {
  const rules = useMemo(() => getAlertRules(), [])
  const active = useMemo(() => getActiveAlertRuleCount(), [])
  const anomalyTypes = useMemo(() => getAnomalyTypeCount(), [])
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')

  const visible = statusFilter === 'ALL' ? rules : rules.filter((r) => (statusFilter === 'ACTIVE' ? r.isActive : !r.isActive))

  return (
    <PageShell>
      <PageHeader
        title='Règles d’alerte'
        description='Règles de notification déclenchées par les anomalies selon leur type et leur sévérité.'
      />

      <div className='grid gap-4 sm:grid-cols-3'>
        <KpiTile label='Règles' value={String(rules.length)} />
        <KpiTile label='Règles actives' value={String(active)} />
        <KpiTile label='Types d’anomalies couverts' value={String(anomalyTypes)} />
      </div>

      <SectionCard
        title='Règles'
        description='Chaque règle cible un groupe de notification.'
        actions={
          <div className='flex gap-1'>
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((s) => (
              <button
                key={s}
                type='button'
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium',
                  statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70',
                )}
              >
                {s === 'ALL' ? 'Toutes' : s === 'ACTIVE' ? 'Actives' : 'Inactives'}
              </button>
            ))}
          </div>
        }
      >
        <div className='space-y-2'>
          {visible.map((rule) => (
            <AlertRuleRow key={rule.id} rule={rule} />
          ))}
        </div>
      </SectionCard>
    </PageShell>
  )
}

function AlertRuleRow({ rule }: { rule: AlertRuleView }) {
  return (
    <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3'>
      <div className='flex min-w-0 items-center gap-2'>
        <BellRing className='size-4 shrink-0 text-primary' />
        <div className='min-w-0'>
          <p className='truncate text-sm font-medium'>{rule.name}</p>
          <p className='text-xs text-muted-foreground'>Groupe : {rule.targetGroupName}</p>
        </div>
      </div>
      <div className='flex flex-wrap items-center gap-1.5'>
        {rule.anomalyType && (
          <Badge variant='outline' className='font-mono text-[10px]'>
            {rule.anomalyType}
          </Badge>
        )}
        {rule.minSeverity && (
          <Badge variant='secondary'>{alertSeverityLabels[rule.minSeverity]}</Badge>
        )}
        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
          {rule.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>
    </div>
  )
}