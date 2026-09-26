import { Gauge, ShieldAlert, Truck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { periodLabelKey } from '../data/dashboard-query'
import type { DashboardView } from '../data/dashboard'

const toneClasses = {
  rose: 'bg-rose-500/10 border-rose-500/20 text-rose-600',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
  sky: 'bg-sky-500/10 border-sky-500/20 text-sky-600',
  amber: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
} as const

export function DashboardKpiStrip({ dashboard }: { dashboard: DashboardView }) {
  const { t } = useTranslation('dashboard')
  const { overview } = dashboard
  const utilization =
    overview.totalTrucks === 0
      ? 0
      : Math.round((overview.activeTrucks / overview.totalTrucks) * 100)

  const items = [
    {
      label: t('secondary.mobilization'),
      value: `${utilization} %`,
      subValue: t('secondary.activeTrucks', {
        active: overview.activeTrucks,
        total: overview.totalTrucks,
      }),
      icon: Truck,
      tone: 'sky' as const,
    },
    {
      label: t('secondary.serviceRate'),
      value: `${overview.serviceRate} %`,
      subValue: t('secondary.periodContext', {
        period: t(periodLabelKey(overview.period)),
      }),
      icon: Gauge,
      tone: overview.serviceRate < 75 ? ('amber' as const) : ('emerald' as const),
    },
    {
      label: t('secondary.risks'),
      value: t('secondary.criticalCount', { count: overview.criticalAlerts }),
      subValue: t('secondary.riskContext', { alerts: overview.openAlerts }),
      icon: ShieldAlert,
      tone:
        overview.criticalAlerts > 0 ? ('rose' as const) : ('emerald' as const),
    },
  ]

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
              toneClasses[item.tone],
            )}
          >
            <item.icon className='size-4' />
          </div>
          <div className='min-w-0'>
            <p className='text-xs tracking-[0.12em] text-muted-foreground uppercase'>
              {item.label}
            </p>
            <p className='truncate text-sm font-semibold'>{item.value}</p>
            <p className='truncate text-xs text-muted-foreground'>{item.subValue}</p>
          </div>
        </div>
      ))}
    </section>
  )
}
