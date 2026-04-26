import { type ChangeEvent, useCallback, useMemo, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import {
  Activity,
  CalendarDays,
  ChevronDown,
  Clock3,
  Gauge,
  Layers3,
  Moon,
  Search,
  SlidersHorizontal,
  Sun,
  Truck as TruckIcon,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  siteTypeLabels,
  siteTypeOptions,
  sites,
  type SiteType,
} from '@/features/sites/data/sites'
import { TruckDetailsSheet } from './components/truck-details-sheet'
import { TrucksMap } from './components/trucks-map'
import { TrucksTable } from './components/trucks-table'
import {
  getTruckTelemetry,
  trucks,
  type Truck,
  type TruckStatus,
} from './data/trucks'

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
  const [activeTruckId, setActiveTruckId] = useState(trucks[0].id)
  const [detailsTruck, setDetailsTruck] = useState<Truck | null>(null)
  const { resolvedTheme, setTheme } = useTheme()

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
  }, [search, statusFilter])

  const selectedTruck =
    filteredTrucks.find((truck) => truck.id === activeTruckId) ??
    filteredTrucks[0] ??
    trucks[0]
  const filteredSites = useMemo(() => {
    if (!showSites) return []

    return sites.filter((site) => {
      return siteFilter === 'all' ? true : site.type === siteFilter
    })
  }, [showSites, siteFilter])

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
  }, [])

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
    return Math.round(sum / list.length)
  }, [filteredTrucks])

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
  }, [])
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
    <main
      id='main-content'
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <section className='rounded-2xl border-transparent bg-background/88 p-3 shadow-sm backdrop-blur-sm sm:p-4'>
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
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='size-9 border-transparent bg-background/85 shadow-xs'
                onClick={() =>
                  setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
                }
                aria-label='Basculer theme'
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className='size-4' />
                ) : (
                  <Moon className='size-4' />
                )}
              </Button>
              <Button
                variant='outline'
                className='h-9 justify-start gap-2 border-transparent bg-background/85 px-2 shadow-xs'
              >
                <Avatar className='size-6 rounded-md'>
                  <AvatarFallback className='rounded-md bg-primary/15 text-xs font-semibold text-primary'>
                    JD
                  </AvatarFallback>
                </Avatar>
                <span className='text-sm'>John Davis</span>
                <ChevronDown className='size-4 text-muted-foreground' />
              </Button>
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

      <section className='rounded-2xl border-transparent bg-background/88 p-4 shadow-sm backdrop-blur-sm'>
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
                  <SelectTrigger className='h-10 w-full rounded-xl border-transparent bg-background/80 shadow-xs'>
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
              <div className='rounded-xl bg-muted/25 px-3 py-3 text-sm text-muted-foreground'>
                Active l'affichage des sites pour filtrer les dépôts, sites SCDP
                et centres emplisseurs.
              </div>
            )}
          </ToolbarGroup>
        </div>
      </section>

      <section className='relative overflow-hidden rounded-2xl border-transparent bg-muted/70 shadow-sm'>
        <TrucksMap
          sites={filteredSites}
          trucks={filteredTrucks}
          selectedTruck={selectedTruck}
          mapTheme={resolvedTheme}
          showRoutes={showRoutes}
          onSelectTruck={handleSelectTruck}
        />
      </section>

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
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
          <Badge
            variant='outline'
            className='border-transparent bg-muted/35 text-foreground'
          >
            {trucks.length} camions
          </Badge>
        </div>
        <TrucksTable
          data={trucks}
          search={tableSearch}
          navigate={navigate}
          onViewDetails={handleViewDetails}
        />
      </section>

      <TruckDetailsSheet
        truck={detailsTruck}
        open={detailsTruck !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsTruck(null)
        }}
      />
    </main>
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
    <label className='flex items-center justify-between gap-3 rounded-xl bg-muted/35 px-3 py-2.5 text-sm shadow-xs'>
      <span className='text-muted-foreground'>{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </label>
  )
}
