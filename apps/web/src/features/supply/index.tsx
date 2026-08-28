import { useMemo, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { CalendarDays, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SupplyTable } from './components/supply-table'
import {
  supplyView,
  type SupplyRequest,
} from './data/supply'

type SupplyFilter = 'all' | SupplyRequest['status']

type SupplyFilterDef = { label: string; value: SupplyFilter; count: number }

const supplyRoute = getRouteApi('/_authenticated/supply/')

export function SupplyRequestPage() {
  const navigate = supplyRoute.useNavigate()
  const search = supplyRoute.useSearch()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<SupplyFilter>('all')

  const filtered = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    let items: SupplyRequest[] = [...supplyView]
    if (query) {
      items = items.filter((item) => {
        const haystack = [
          item.id,
          item.marketeurOrgId,
          item.sourceSiteName,
          item.destSiteName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(query)
      })
    }
    if (statusFilter !== 'all') {
      items = items.filter((item) => item.status === statusFilter)
    }
    return items
  }, [searchText, statusFilter])

  const filterDefs: SupplyFilterDef[] = useMemo(() => {
    const counts: Partial<Record<SupplyRequest['status'], number>> = {}
    for (const item of supplyView) {
      counts[item.status] = (counts[item.status] ?? 0) + 1
    }
    return [
      { label: 'Tous', value: 'all', count: supplyView.length },
      { label: 'Brouillon', value: 'DRAFT', count: counts.DRAFT ?? 0 },
      { label: 'Validée', value: 'VALIDATED', count: counts.VALIDATED ?? 0 },
      { label: 'En cours', value: 'INPROGRESS', count: counts.INPROGRESS ?? 0 },
      { label: 'Terminée', value: 'COMPLETED', count: counts.COMPLETED ?? 0 },
      { label: 'Annulée', value: 'CANCELLED', count: counts.CANCELLED ?? 0 },
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
              label='Total demandes'
              value={`${supplyView.length}`}
            />
            <TopStat
              label='En cours'
              value={`${supplyView.filter((r) => r.status === 'INPROGRESS').length}`}
            />
            <TopStat
              label='Complétées'
              value={`${supplyView.filter((r) => r.status === 'COMPLETED').length}`}
            />
          </div>

          <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center'>
            <div className='relative w-full sm:w-[310px]'>
              <Search className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder='Rechercher une demande...'
                className='h-9 ps-9'
              />
            </div>
          </div>
        </div>

        <div className='mt-4 flex flex-col gap-1'>
          <h1 className='text-[30px] leading-none font-semibold tracking-tight sm:text-3xl'>
            Demandes de ramassage
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
              active={statusFilter === filter.value}
              onClick={() => setStatusFilter(filter.value)}
            />
          ))}
        </div>
      </section>

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
        <div className='flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h2 className='text-xl font-semibold tracking-tight'>Liste des demandes</h2>
            <p className='text-sm text-muted-foreground'>
              Consultez les demandes de ramassage de LPG, leur statut et les sites concernés.
            </p>
          </div>
          <Badge
            variant='outline'
            className='border-transparent bg-muted/35 text-foreground'
          >
            {filtered.length} / {supplyView.length} demandes
          </Badge>
        </div>
        <SupplyTable
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
