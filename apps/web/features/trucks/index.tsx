import { type ChangeEvent, useCallback, useMemo, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import {
  Activity,
  CalendarDays,
  ChevronDown,
  Clock3,
  Gauge,
  Layers3,
  Search,
  SlidersHorizontal,
  Truck as TruckIcon,
  Users,
} from 'lucide-react'
import { cn } from '@lpg/ui'
import { useTheme } from '@/context/theme-provider'
import { Badge, Button, Input } from '@lpg/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lpg/ui'
import { Switch } from '@lpg/ui'
import {
  siteTypeLabels,
  siteTypeOptions,
  type Site,
  type SiteType,
} from '@/features/sites/sites'
import { TruckDetailsSheet } from './truck-details-sheet'
import { TrucksMap } from './trucks-map'
import { TrucksTable } from './trucks-table'
import { PageShell } from '@/components/layout/page'
import { trucksHooks, sitesHooks } from '@/lib/api/use-resources'
import { mapSite } from '@/lib/api/mappers'
import {
  getTruckTelemetry,
  type Truck,
  type TruckStatus,
} from './trucks'

type TruckFilter = 'all' | TruckStatus
type SiteFilter = 'all' | SiteType

const route = getRouteApi('/_authenticated/trucks/')

const filters: { label: string; value: TruckFilter }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'Disponible', value: 'available' },
  { label: 'En livraison', value: 'in_transit' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Inactif', value: 'inactive' },
]

export function TrucksPage() {
  const tableSearch = route.useSearch()
  const navigate = route.useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TruckFilter>('all')
  const [showRoutes, setShowRoutes] = useState(true)
  const [showSites, setShowSites] = useState(true)
  const [siteFilter, setSiteFilter] = useState<SiteFilter>('all')
  const [detailsTruck, setDetailsTruck] = useState<Truck | null>(null)
  const { resolvedTheme } = useTheme()

  const {
    data: trucksResult,
    isPending: trucksPending,
    isError: trucksError,
    error: trucksErr,
    refetch: refetchTrucks,
  } = trucksHooks.useList({ page: 1, limite: 100 })

  const { data: sitesResult } = sitesHooks.useList({ page: 1, limite: 100 })

  const trucks: Truck[] = (trucksResult?.data ?? []) as Truck[]
  const sites: Site[] = ((sitesResult?.data ?? []) as unknown as import('@lpg/types').Site[]).map(
    mapSite
  )

  const [activeTruckId, setActiveTruckId] = useState<string | null>(null)

  const handleViewDetails = useCallback((truck: Truck) => {
    setActiveTruckId(truck.id)
    setDetailsTruck(truck)
  }, [])

  const handleSelectTruck = useCallback((truck: Truck) => {
    setActiveTruckId(truck.id)
  }, [])

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
  }

  const filteredTrucks = useMemo(() => {
    const query = search.trim().toLowerCase()

    return trucks.filter((truck) => {
      const matchesStatus =
        statusFilter === 'all' ? true : truck.status === statusFilter
      const matchesSearch =
        query.length === 0
          ? true
          : [
              truck.id,
              truck.plateNumber,
              truck.assignedDriver,
              truck.tenantName,
              truck.marketer,
              truck.currentLocation,
              truck.destination,
            ]
              .join(' ')
              .toLowerCase()
              .includes(query)

      return matchesStatus && matchesSearch
    })
  }, [trucks, search, statusFilter])

  const selectedTruck =
    (activeTruckId &&
      (filteredTrucks.find((truck) => truck.id === activeTruckId) ??
        filteredTrucks[0])) ||
    filteredTrucks[0] ||
    null
  const filteredSites = useMemo(() => {
    if (!showSites) return []

    return sites.filter((site) => {
      return siteFilter === 'all' ? true : site.type === siteFilter
    })
  }, [sites, showSites, siteFilter])

  const totals = useMemo(() => {
    return {
      all: trucks.length,
      available: trucks.filter((truck) => truck.status === 'available').length,
      in_transit: trucks.filter((truck) => truck.status === 'in_transit')
        .length,
      maintenance: trucks.filter((truck) => truck.status === 'maintenance')
        .length,
      inactive: trucks.filter((truck) => truck.status === 'inactive').length,
    }
  }, [trucks])

  const dateText = useMemo(() => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date())
  }, [])

  const avgLpg = useMemo(() => {
    const list = filteredTrucks.length > 0 ? filteredTrucks : trucks
    const sum = list.reduce((acc, truck) => {
      return acc + getTruckTelemetry(truck.id).lpgLevelPercent
    }, 0)
    return list.length === 0 ? 0 : Math.round(sum / list.length)
  }, [filteredTrucks, trucks])

  const activeTrucks = totals.available + totals.in_transit
  const etaRate = 94
  const siteTotals = useMemo(() => {
    return {
      all: sites.length,
      depot: sites.filter((site) => site.type === 'depot').length,
      scdp: sites.filter((site) => site.type === 'scdp').length,
      'filling-center': sites.filter(
        (site) => site.type === 'filling-center'
      ).length,
      marketer: sites.filter((site) => site.type === 'marketer').length,
      'delivery-point': sites.filter(
        (site) => site.type === 'delivery-point'
      ).length,
    } satisfies Record<SiteFilter, number>
  }, [sites])
  const siteFilters = [
    { label: 'Tous sites', value: 'all' as const },
    ...siteTypeOptions.map((option) => ({
      label: option.label,
      value: option.value,
    })),
  ]
  const selectedSiteFilterLabel =
    siteFilter === 'all' ? 'Tous sites' : siteTypeLabels[siteFilter]

  return (
    <PageShell>
      <section className='surface-card p-3 sm:p-4'>
        <div className='flex flex-col gap-3'>
          <div className='flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
            <div className='flex flex-wrap items-center gap-2'>
              <TopStat
                icon={TruckIcon}
                label='Active'
                value={`${activeTrucks}/${totals.all}`}
              />
              <TopStat
                icon={Users}
                label='Drivers'
                value={`${totals.all * 2}`}
              />
              <TopStat
                icon={Activity}
                label='Trips'
                value={`${totals.in_transit}`}
              />
              <TopStat icon={Gauge} label='Avg LPG' value={`${avgLpg}%`} />
              <TopStat icon={Clock3} label='On-time' value={`${etaRate}%`} />
            </div>

            <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center'>
              <div className='relative w-full sm:w-[310px]'>
                <Search className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  value={search}
                  onChange={handleSearch}
                  placeholder='Rechercher camion, plaque, chauffeur...'
                  className='h-9 ps-9'
                />
              </div>
            </div>
          </div>

          <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
            <div>
              <h1 className='text-[30px] leading-none font-semibold tracking-tight sm:text-3xl'>
                Dashboard Opérationnel
              </h1>
              <p className='mt-1 inline-flex items-center gap-2 text-xs text-muted-foreground sm:text-sm'>
                <CalendarDays className='size-4' />
                {dateText}
              </p>
            </div>

            <Button
              variant='outline'
              className='h-9 w-fit gap-2 border-transparent bg-background/85 shadow-xs'
            >
              Last 7 days
              <ChevronDown className='size-4 text-muted-foreground' />
            </Button>
          </div>
        </div>
      </section>

      <section className='surface-card p-4'>
        <div className='grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_280px_minmax(0,0.95fr)]'>
          <ToolbarGroup
            icon={TruckIcon}
            title='Statuts'
            className='xl:pr-2'
          >
            <div className='flex flex-wrap gap-2.5'>
              {filters.map((filter) => {
                const count =
                  filter.value === 'all' ? totals.all : totals[filter.value]

                return (
                  <FilterChip
                    key={filter.value}
                    label={filter.label}
                    count={count}
                    active={statusFilter === filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                  />
                )
              })}
            </div>
          </ToolbarGroup>

          <ToolbarGroup
            icon={SlidersHorizontal}
            title='Affichage'
            className='xl:px-5'
          >
            <div className='grid gap-2.5'>
              <ToggleCard
                label='Routes'
                value={showRoutes}
                onChange={setShowRoutes}
              />
              <ToggleCard
                label='Sites'
                value={showSites}
                onChange={setShowSites}
              />
            </div>
          </ToolbarGroup>

          <ToolbarGroup
            icon={Layers3}
            title='Reseau logistique'
            className='xl:pl-2'
          >
            {showSites ? (
              <div className='space-y-2.5'>
                <Select
                  value={siteFilter}
                  onValueChange={(value) => setSiteFilter(value as SiteFilter)}
                >
                  <SelectTrigger className='h-10 w-full rounded-xl border-transparent bg-background shadow-xs'>
                    <SelectValue placeholder={selectedSiteFilterLabel} />
                  </SelectTrigger>
                  <SelectContent>
                    {siteFilters.map((filter) => {
                      const optionLabel =
                        filter.value === 'all'
                          ? filter.label
                          : siteTypeLabels[filter.value]

                      return (
                        <SelectItem key={filter.value} value={filter.value}>
                          {`${optionLabel} (${siteTotals[filter.value]})`}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>

                <p className='px-1 text-xs text-muted-foreground'>
                  Filtre actif: {selectedSiteFilterLabel.toLowerCase()}
                </p>
              </div>
            ) : (
              <div className='surface-sunken px-3 py-3 text-sm text-muted-foreground'>
                Active l'affichage des sites pour filtrer les dépôts, sites SCDP
                et centres emplisseurs.
              </div>
            )}
          </ToolbarGroup>
        </div>
      </section>

      <section className='relative overflow-hidden rounded-2xl border-transparent bg-muted/70 shadow-sm'>
        {selectedTruck ? (
          <TrucksMap
            sites={filteredSites}
            trucks={filteredTrucks}
            selectedTruck={selectedTruck}
            mapTheme={resolvedTheme === 'dark' ? 'dark' : 'light'}
            showRoutes={showRoutes}
            onSelectTruck={handleSelectTruck}
          />
        ) : (
          <div className='flex h-72 items-center justify-center text-sm text-muted-foreground'>
            {trucksPending
              ? 'Chargement de la flotte...'
              : trucksError
                ? 'Donnees indisponibles.'
                : 'Aucun camion a afficher.'}
          </div>
        )}
      </section>

      <section className='surface-card space-y-4 p-4'>
        <div className='flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h2 className='text-xl font-semibold tracking-tight'>
              Liste des camions
            </h2>
            <p className='text-sm text-muted-foreground'>
              Filtre par entreprise, statut, site ou contrat, puis choisis les
              colonnes a afficher.
            </p>
          </div>
          {trucksError ? (
            <Button
              variant='outline'
              size='sm'
              onClick={() => refetchTrucks()}
              className='h-9 w-fit gap-2'
            >
              Reessayer
            </Button>
          ) : (
            <Badge
              variant='outline'
              className='border-transparent bg-muted/35 text-foreground'
            >
              {trucks.length} camions
            </Badge>
          )}
        </div>
        {trucksError ? (
          <div className='rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive'>
            <p>Impossible de charger les camions.</p>
            <p className='mt-1 text-xs opacity-80'>
              {String(trucksErr?.message ?? '')}
            </p>
          </div>
        ) : (
          <TrucksTable
            data={trucks}
            search={tableSearch}
            navigate={navigate}
            onViewDetails={handleViewDetails}
          />
        )}
      </section>

      <TruckDetailsSheet
        truck={detailsTruck}
        open={detailsTruck !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsTruck(null)
        }}
      />
    </PageShell>
  )
}

function TopStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string | number
}) {
  return (
    <div className='inline-flex items-center gap-1.5 rounded-full border-transparent bg-background/90 px-2.5 py-1 text-xs shadow-xs'>
      <Icon className='size-3.5 text-primary' />
      <span className='text-muted-foreground'>{label}</span>
      <span className='font-semibold'>{value}</span>
    </div>
  )
}

function ToolbarGroup({
  icon: Icon,
  title,
  className,
  children,
}: {
  icon: React.ElementType
  title: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className='flex items-center gap-2 text-sm font-medium'>
        <span className='flex size-8 items-center justify-center rounded-full bg-muted/55 text-muted-foreground'>
          <Icon className='size-4' />
        </span>
        <span>{title}</span>
      </div>
      {children}
    </div>
  )
}

function FilterChip({
  label,
  count,
  active,
  onClick,
  icon: Icon,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
  icon?: React.ElementType
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
      {Icon ? <Icon className='size-4' /> : null}
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

function ToggleCard({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className='surface-sunken flex items-center justify-between gap-3 px-3 py-2.5 text-sm'>
      <span className='text-muted-foreground'>{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </label>
  )
}
