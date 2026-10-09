import { ArrowDownRight, ArrowUpRight, Ellipsis, Minus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Role } from '@/config/rbac/roles'
import {
  type KpiCard,
  type KpiStripContext,
  buildKpiStrip,
  formatKpiDelta,
  type DeltaTone,
} from '../data/kpi-cards'

export interface LpgKpiStripProps {
  role: Role
  periodLabel: string
  metrics?: KpiStripContext
}

const TONE_CLASS: Record<DeltaTone, string> = {
  good: 'border-transparent bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  bad: 'border-transparent bg-destructive/10 text-destructive',
  neutral: 'border-transparent bg-muted text-muted-foreground',
}

function DeltaBadge({ card }: { card: KpiCard }) {
  if (!card.delta) return null
  const { delta } = card
  return (
    <Badge className={TONE_CLASS[delta.tone]}>
      {delta.direction === 'up' ? (
        <ArrowUpRight className='mr-0.5 size-3.5' />
      ) : delta.direction === 'down' ? (
        <ArrowDownRight className='mr-0.5 size-3.5' />
      ) : (
        <Minus className='mr-0.5 size-3.5' />
      )}
      {formatKpiDelta(delta)}
    </Badge>
  )
}

export function LpgKpiStrip({
  role,
  periodLabel,
  metrics,
}: LpgKpiStripProps) {
  const kpis = buildKpiStrip(role, metrics)

  return (
    <div className='overflow-hidden rounded-xl border bg-card shadow-xs ring-1 ring-foreground/10'>
      <div className='grid divide-y *:data-[slot=card]:rounded-none *:data-[slot=card]:border-0 *:data-[slot=card]:shadow-none *:data-[slot=card]:ring-0 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5'>
        {kpis.map((kpi) => (
          <Card key={kpi.id} className='transition-colors hover:bg-muted/15'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-normal text-muted-foreground'>
                {kpi.title}
              </CardTitle>
              <CardAction>
                <DropdownMenu>
                  <DropdownMenuTrigger className='inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none'>
                    <Ellipsis className='size-4' />
                    <span className='sr-only'>Actions pour {kpi.title}</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-48'>
                    <DropdownMenuItem className='text-xs'>
                      Voir le détail des livraisons
                    </DropdownMenuItem>
                    <DropdownMenuItem className='text-xs'>
                      Exporter les données
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardAction>
            </CardHeader>
            <CardContent className='flex flex-col gap-3 pt-0'>
              <div className='flex items-center justify-between gap-4'>
                <div className='font-manrope text-2xl font-semibold leading-none tracking-tight text-foreground'>
                  {kpi.value}
                </div>
                <DeltaBadge card={kpi} />
              </div>

              <div className='flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
                {kpi.baseline ? (
                  <>
                    <span>
                      vs{' '}
                      <span className='font-medium text-foreground'>{kpi.baseline}</span>
                    </span>
                    <span>•</span>
                  </>
                ) : null}
                <span>{periodLabel}</span>
              </div>

              {kpi.note ? (
                <p className='text-xs text-muted-foreground'>{kpi.note}</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
