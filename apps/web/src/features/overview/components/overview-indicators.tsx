import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowUpDown,
  Building2,
  Cpu,
  Flag,
  Layers,
  LineChart,
  MapPin,
  Route,
  Scale,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type {
  OverviewCard,
  OverviewCardIcon,
  OverviewCardTone,
} from '../data/overview'

const iconMap: Record<OverviewCardIcon, LucideIcon> = {
  organizations: Building2,
  users: Users,
  sites: MapPin,
  tours: Route,
  anomalies: AlertTriangle,
  reconciliations: Scale,
  devices: Cpu,
  traceability: LineChart,
  checkpoints: Flag,
  volumes: ArrowUpDown,
  reserve: Layers,
}

const toneIconClasses: Record<OverviewCardTone, string> = {
  sky: 'border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300',
  emerald:
    'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  amber:
    'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300',
  rose: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300',
  slate:
    'border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-300',
}

const toneProgressClasses: Record<OverviewCardTone, string> = {
  sky: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  slate: 'bg-slate-500',
}

/**
 * Role-specific KPI grid. Cards carry a deep-link to their operational
 * domain and an optional progress bar.
 */
export function OverviewIndicators({ cards }: { cards: OverviewCard[] }) {
  return (
    <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
      {cards.map((card) => (
        <IndicatorCard key={card.id} card={card} />
      ))}
    </section>
  )
}

function IndicatorCard({ card }: { card: OverviewCard }) {
  const Icon = iconMap[card.icon] ?? Route

  return (
    <Link
      to={card.href as never}
      className='group block'
    >
      <Card className='flex h-full flex-col rounded-2xl border-border/60 shadow-none transition-colors group-hover:border-border group-hover:bg-muted/30'>
        <CardHeader className='flex flex-row items-center gap-3 space-y-0 pb-3'>
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl border',
              toneIconClasses[card.tone]
            )}
          >
            <Icon className='size-5' />
          </div>
          <div className='min-w-0 space-y-0.5'>
            <CardTitle className='truncate text-sm font-medium'>
              {card.label}
            </CardTitle>
            <p className='truncate text-xs text-muted-foreground'>
              {card.detail}
            </p>
          </div>
        </CardHeader>
        <CardContent className='flex flex-1 flex-col justify-between gap-3'>
          <p className='text-3xl font-semibold tracking-tight'>
            {card.value}
          </p>
          {typeof card.progress === 'number' ? (
            <div className='h-1.5 overflow-hidden rounded-full bg-muted/40'>
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  toneProgressClasses[card.tone]
                )}
                style={{ width: `${Math.min(Math.max(card.progress, 0), 100)}%` }}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  )
}
