import { useMemo, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { CalendarDays, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RecomputeTable } from './components/recompute-table'
import {
  riskLevelLabels,
  recomputeView,
  type RiskScoreView,
} from './data/recompute'

type RecomputeFilter = 'all' | RiskScoreView['level']

type RecomputeFilterDef = { label: string; value: RecomputeFilter; count: number }

const recomputeRoute = getRouteApi('/_authenticated/recompute/')

export function RecomputePage() {
const navigate = recomputeRoute.useNavigate()
  const search = recomputeRoute.useSearch()
  const [searchText, setSearchText] = useState('')
  const [levelFilter, setLevelFilter] = useState<RecomputeFilter>('all')

  const filtered = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    let items: RiskScoreView[] = [...recomputeView]
    if (query) {
      items = items.filter((item) => {
        const haystack = [
          item.id,
          item.entityId,
          item.entityType,
          riskLevelLabels[item.level],
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(query)
      })
    }
    if (levelFilter !== 'all') {
      items = items.filter((item) => item.level === levelFilter)
    }
    return items
  }, [searchText, levelFilter])

  const filterDefs: RecomputeFilterDef[] = useMemo(() => {
    const counts: Partial<Record<RiskScoreView['level'], number>> = {}
    for (const item of recomputeView) {
      counts[item.level] = (counts[item.level] ?? 0) + 1
    }
    return [
      { label: 'Tous', value: 'all', count: recomputeView.length },
      { label: 'Faible', value: 'FAIBLE', count: counts.FAIBLE ?? 0 },
      { label: 'Modere', value: 'MODERE', count: counts.MODERE ?? 0 },
      { label: 'Eleve', value: 'ELEVE', count: counts.ELEVE ?? 0 },
      { label: 'Critique', value: 'CRITIQUE', count: counts.CRITIQUE ?? 0 },
      { label: 'Critique extreme', value: 'CRITIQUEEXTREME', count: counts.CRITIQUEEXTREME ?? 0 },
    ]
  }, [])

  const dateText = useMemo(
    () =>
      new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    []
  )

  return (
    <main
      id='main-content'
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <section className='rounded-2xl border-transparent bg-background/88 p-3 shadow-sm backdrop-blur-sm sm:p-4'>
        <div className='flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
          <div className='flex flex-wrap items-center gap-2'>
            <TopStat
              label='Total scores'
              value={recomputeView.length}
            />
            <TopStat
              label='Critiques'
              value={recomputeView.filter((r) => r.level === 'CRITIQUE' || r.level === 'CRITIQUEEXTREME').length}
            />
            <TopStat
              label='Faibles'
              value={recomputeView.filter((r) => r.level === 'FAIBLE').length}
            />
          </div>

          <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center'>
            <div className='relative w-full sm:w-[310px]'>
              <Search className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder='Rechercher un score...'
                className='h-9 ps-9'
              />
            </div>
          </div>
        </div>

        <div className='mt-4 flex flex-col gap-1'>
          <h1 className='text-[30px] leading-none font-semibold tracking-tight sm:text-3xl'>
            Historique de recalcul
          </h1>
          <p className='inline-flex items-center gap-2 text-xs text-muted-foreground sm:text-sm'>
            <CalendarDays className='size-4' />
            {dateText}
          </p>
        </div>
      </section>

      <section className='rounded-2xl border-transparent bg-background/88 p-4 shadow-sm backdrop-blur-sm'>
        <div className='flex flex-wrap gap-2.5'>
          {filterDefs.map((filter) => (
            <FilterChip
              key={filter.value}
              label={filter.label}
              count={filter.count}
              active={levelFilter === filter.value}
              onClick={() => setLevelFilter(filter.value)}
            />
          ))}
        </div>
      </section>

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
        <div className='flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h2 className='text-xl font-semibold tracking-tight'>Scores de risque</h2>
            <p className='text-sm text-muted-foreground'>
              Historique des calculs de score de risque par entité et période.
            </p>
          </div>
          <Badge
            variant='outline'
            className='border-transparent bg-muted/35 text-foreground'
          >
            {filtered.length} / {recomputeView.length} scores
          </Badge>
        </div>
        <RecomputeTable
          data={filtered}
          search={search}
          navigate={navigate}
        />
      </section>
    </main>
  )
}

function TopStat({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className='inline-flex items-center gap-1.5 rounded-full border-transparent bg-background/90 px-2.5 py-1 text-xs shadow-xs'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='font-semibold'>{value}</span>
    </div>
  )
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <Button
      type='button'
      variant={active ? 'default' : 'outline'}
      size='sm'
      className={cn(
        'h-10 rounded-full px-4 text-sm shadow-xs',
        active
          ? 'border-transparent shadow-sm'
          : 'border-transparent bg-background/85 hover:bg-muted/35'
      )}
      onClick={onClick}
    >
      <span>{label}</span>
      <Badge
        className={cn(
          'ms-2 rounded-full px-1.5 py-0 text-[10px]',
          active
            ? 'bg-primary-foreground/20 text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {count}
      </Badge>
    </Button>
  )
}
