import { ArrowDownToLine, FilterX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { DateRangePicker } from '@/components/date-range-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { exportDashboardCsv } from '../lib/export-csv'
import {
  periodLabelKey,
  selectDashboardFleet,
  selectDashboardPeriod,
  type DashboardPeriod,
  type DashboardQuery,
} from '../data/dashboard-query'
import type { DashboardView } from '../data/dashboard'

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
  const { t } = useTranslation('dashboard')
  const hasActiveFilter = Boolean(query.range?.from || query.range?.to || query.fleetName)
  const hasExportableView =
    dashboard.routeContributions.length > 0 || dashboard.fleets.length > 0
  const filterContext = query.fleetName
    ? t('filters.contextWithFleet', { fleet: query.fleetName })
    : t('filters.contextAllFleets')

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-3 shadow-none md:flex-row md:items-center md:justify-between'>
      <div className='flex flex-1 flex-col gap-3 sm:flex-row sm:items-center'>
        <DateRangePicker
          ariaLabel={t('filters.dateRange')}
          value={query.range}
          onValueChange={(range) => onQueryChange({ ...query, range })}
          className='w-full sm:w-[280px]'
        />

        <Tabs
          aria-label={t('filters.period')}
          value={query.period ?? 'daily'}
          onValueChange={(value) =>
            onQueryChange(
              selectDashboardPeriod(query, value as DashboardPeriod),
            )
          }
        >
          <TabsList className='h-10 rounded-xl bg-muted/40 p-1'>
            <TabsTrigger
              value='daily'
              className='rounded-lg px-3 text-xs data-[state=active]:bg-background'
            >
              {t('filters.day')}
            </TabsTrigger>
            <TabsTrigger
              value='weekly'
              className='rounded-lg px-3 text-xs data-[state=active]:bg-background'
            >
              {t('filters.week')}
            </TabsTrigger>
            <TabsTrigger
              value='monthly'
              className='rounded-lg px-3 text-xs data-[state=active]:bg-background'
            >
              {t('filters.month')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select
          value={query.fleetName ?? 'all'}
          onValueChange={(value) =>
            onQueryChange(selectDashboardFleet(query, value))
          }
        >
          <SelectTrigger
            aria-label={t('filters.fleet')}
            className='h-10 w-full rounded-xl bg-background shadow-none sm:w-[220px]'
          >
            <SelectValue placeholder={t('filters.allFleets')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{t('filters.allFleets')}</SelectItem>
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
            onClick={() => onQueryChange({ period: query.period ?? 'daily' })}
          >
            <FilterX className='size-4' />
            {t('filters.reset')}
          </Button>
        ) : null}
      </div>

      <div className='flex items-center gap-2'>
        <span className='hidden text-xs text-muted-foreground lg:inline'>
          {dashboard.overview.dateRangeLabel}
        </span>
        <span
          role='status'
          aria-live='polite'
          aria-atomic='true'
          className='sr-only'
        >
          {t('filters.liveContext', {
            period: t(periodLabelKey(query.period ?? 'daily')),
            context: filterContext,
          })}
        </span>
        <Button
          type='button'
          variant='outline'
          className='h-10 rounded-xl bg-background shadow-none'
          onClick={() => exportDashboardCsv(dashboard, t)}
          disabled={!hasExportableView}
        >
          <ArrowDownToLine className='size-4' />
          {t('filters.export')}
        </Button>
      </div>
    </div>
  )
}
