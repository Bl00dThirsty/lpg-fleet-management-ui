import { ArrowDownToLine, FilterX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DateRangePicker } from '@/components/date-range-picker'
import { exportDashboardCsv } from '../lib/export-csv'
import type { DashboardView, DashboardQuery, DashboardPeriod } from '../data/dashboard'

export type { DashboardQuery }

type DashboardFiltersProps = {
  query: DashboardQuery
  onQueryChange: (next: DashboardQuery) => void
  fleetOptions: string[]
  dashboard: DashboardView
}

export function DashboardFilters({
  query,
  onQueryChange,
  fleetOptions,
  dashboard,
}: DashboardFiltersProps) {
  const hasActiveFilter = Boolean(query.range?.from || query.range?.to || query.fleetName)

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-none md:flex-row md:items-center md:justify-between'>
      <div className='flex flex-1 flex-col gap-3 sm:flex-row sm:items-center'>
        <DateRangePicker
          value={query.range}
          onValueChange={(range) => onQueryChange({ ...query, range })}
          className='w-full sm:w-[280px]'
        />

        <Tabs
          value={query.period}
          onValueChange={(value) =>
            onQueryChange({ ...query, period: value as DashboardPeriod })
          }
        >
          <TabsList className='h-10 rounded-xl bg-muted/40 p-1'>
            <TabsTrigger value='daily' className='rounded-lg px-3 text-xs data-[state=active]:bg-background'>
              Jour
            </TabsTrigger>
            <TabsTrigger value='weekly' className='rounded-lg px-3 text-xs data-[state=active]:bg-background'>
              Semaine
            </TabsTrigger>
            <TabsTrigger value='monthly' className='rounded-lg px-3 text-xs data-[state=active]:bg-background'>
              Mois
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select
          value={query.fleetName ?? 'all'}
          onValueChange={(value) =>
            onQueryChange({ ...query, fleetName: value === 'all' ? undefined : value })
          }
        >
          <SelectTrigger className='h-10 w-full rounded-xl bg-background shadow-none sm:w-[220px]'>
            <SelectValue placeholder='Tous les transporteurs' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Tous les transporteurs</SelectItem>
            {fleetOptions.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilter ? (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='h-10 rounded-xl'
            onClick={() => onQueryChange({ period: query.period })}
          >
            <FilterX className='size-4' />
            Réinitialiser
          </Button>
        ) : null}
      </div>

      <div className='flex items-center gap-2'>
        <span className='hidden text-xs text-muted-foreground lg:inline'>
          {dashboard.overview.dateRangeLabel}
        </span>
        <Button
          type='button'
          variant='outline'
          className='h-10 rounded-xl bg-background shadow-none'
          onClick={() => exportDashboardCsv(dashboard)}
        >
          <ArrowDownToLine className='size-4' />
          Exporter
        </Button>
      </div>
    </div>
  )
}
