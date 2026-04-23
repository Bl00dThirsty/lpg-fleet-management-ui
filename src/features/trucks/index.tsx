import { type ChangeEvent, useCallback, useMemo, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  Clock3,
  Gauge,
  MapPin,
  Moon,
  Search,
  Sun,
  Truck as TruckIcon,
  Users,
  X,
} from 'lucide-react'
import lpgTankImage from '@/assets/lpg-tank.png'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { TruckDetailsSheet } from './components/truck-details-sheet'
import { TrucksMap } from './components/trucks-map'
import { TrucksTable } from './components/trucks-table'
import {
  getTruckTelemetry,
  statusClasses,
  statusLabels,
  trucks,
  type Truck,
  type TruckStatus,
  type TruckTelemetry,
} from './data/trucks'

type TruckFilter = 'all' | TruckStatus

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
  const [showAlerts, setShowAlerts] = useState(true)
  const [showInfoPanel, setShowInfoPanel] = useState(true)
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
  const selectedTelemetry = getTruckTelemetry(selectedTruck.id)

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

  return (
    <main
      id='main-content'
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <section className='rounded-2xl border bg-background/90 p-3 shadow-sm backdrop-blur-sm sm:p-4'>
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
                className='size-9'
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
                className='h-9 justify-start gap-2 px-2'
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

            <Button variant='outline' className='h-9 w-fit gap-2'>
              Last 7 days
              <ChevronDown className='size-4 text-muted-foreground' />
            </Button>
          </div>
        </div>
      </section>

      <section className='flex flex-col gap-3 rounded-2xl border bg-background/85 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-wrap items-center gap-2'>
          {filters.map((filter) => {
            const isActive = statusFilter === filter.value
            const count =
              filter.value === 'all' ? totals.all : totals[filter.value]

            return (
              <Button
                key={filter.value}
                type='button'
                variant={isActive ? 'default' : 'outline'}
                size='sm'
                className='h-8 rounded-full px-3'
                onClick={() => setStatusFilter(filter.value)}
              >
                <span>{filter.label}</span>
                <Badge
                  className={cn(
                    'ms-2 rounded-full px-1.5 py-0 text-[10px]',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {count}
                </Badge>
              </Button>
            )
          })}
        </div>

        <div className='flex flex-wrap items-center gap-x-5 gap-y-2'>
          <ToggleLine
            label='Routes'
            value={showRoutes}
            onChange={setShowRoutes}
          />
          <ToggleLine
            label='Alertes'
            value={showAlerts}
            onChange={setShowAlerts}
          />
          <ToggleLine
            label='Infos camion'
            value={showInfoPanel}
            onChange={setShowInfoPanel}
          />
        </div>
      </section>

      <section className='relative overflow-hidden rounded-2xl border bg-muted shadow-sm'>
        <TrucksMap
          trucks={filteredTrucks}
          selectedTruck={selectedTruck}
          mapTheme={resolvedTheme}
          showRoutes={showRoutes}
          onSelectTruck={handleSelectTruck}
        />

        {showInfoPanel ? (
          <FloatingTruckPanel
            truck={selectedTruck}
            telemetry={selectedTelemetry}
            showAlerts={showAlerts}
            onClose={() => setShowInfoPanel(false)}
            onViewDetails={handleViewDetails}
          />
        ) : null}
      </section>

      <section className='space-y-4 rounded-xl border bg-background p-4 shadow-sm'>
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
          <Badge variant='outline'>{trucks.length} camions</Badge>
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
    <div className='inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs shadow-xs'>
      <Icon className='size-3.5 text-primary' />
      <span className='text-muted-foreground'>{label}</span>
      <span className='font-semibold'>{value}</span>
    </div>
  )
}

function ToggleLine({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className='inline-flex items-center gap-2 text-xs sm:text-sm'>
      <span className='text-muted-foreground'>{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </label>
  )
}

function FloatingTruckPanel({
  truck,
  telemetry,
  showAlerts,
  onClose,
  onViewDetails,
}: {
  truck: Truck
  telemetry: TruckTelemetry
  showAlerts: boolean
  onClose: () => void
  onViewDetails: (truck: Truck) => void
}) {
  const loadedLiters = Math.round(
    (truck.tankCapacityLiters * telemetry.lpgLevelPercent) / 100
  )

  return (
    <div className='pointer-events-none absolute inset-x-3 top-3 z-10 md:inset-x-auto md:top-5 md:left-5 md:w-[390px]'>
      <div className='pointer-events-auto rounded-xl border bg-background/92 p-4 shadow-2xl backdrop-blur-md'>
        <div className='flex items-start gap-3'>
          <div className='flex h-14 w-24 shrink-0 items-center justify-center rounded-lg border bg-muted/35 p-2'>
            <img
              src={lpgTankImage}
              alt=''
              className='max-h-full max-w-full object-contain'
            />
          </div>

          <div className='min-w-0 flex-1'>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0'>
                <p className='text-xs text-muted-foreground'>Camion actif</p>
                <h2 className='truncate text-lg font-semibold tracking-tight'>
                  {truck.id}
                </h2>
              </div>
              <div className='flex shrink-0 items-center gap-1'>
                <Badge
                  className={cn('font-medium', statusClasses[truck.status])}
                >
                  {statusLabels[truck.status]}
                </Badge>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='size-7 rounded-full'
                  onClick={onClose}
                  aria-label='Masquer les infos camion'
                >
                  <X className='size-4' />
                </Button>
              </div>
            </div>
            <p className='mt-1 truncate text-xs text-muted-foreground'>
              {truck.makeModel} - {truck.plateNumber}
            </p>
          </div>
        </div>

        <div className='mt-4 rounded-lg bg-muted/25 p-3'>
          <div className='flex items-center justify-between gap-3 text-xs'>
            <span className='inline-flex min-w-0 items-center gap-1.5 text-muted-foreground'>
              <MapPin className='size-3.5 shrink-0' />
              <span className='truncate'>{truck.currentLocation}</span>
            </span>
            <span className='shrink-0 font-medium'>
              {telemetry.distanceKm} km
            </span>
          </div>
          <div className='mt-2 h-1.5 overflow-hidden rounded-full bg-muted'>
            <div
              className='h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500'
              style={{ width: `${telemetry.routeProgress}%` }}
            />
          </div>
          <div className='mt-2 flex items-center justify-between gap-3 text-xs'>
            <span className='truncate text-muted-foreground'>
              {truck.assignedRoute}
            </span>
            <span className='shrink-0 font-medium'>{truck.destination}</span>
          </div>
        </div>

        <div className='mt-3 space-y-2 text-sm'>
          <InfoMetric label='ETA' value={telemetry.etaText} />
          <InfoMetric
            label='Pression'
            value={`${telemetry.pressureBar.toFixed(1)} bar`}
          />
          <InfoMetric label='Chauffeur' value={truck.assignedDriver} />
          <InfoMetric
            label='Charge GPL'
            value={`${loadedLiters.toLocaleString()} L`}
          />
        </div>

        <div className='mt-3'>
          <div className='mb-1 flex items-center justify-between text-xs'>
            <span className='text-muted-foreground'>Niveau GPL</span>
            <span className='font-semibold'>{telemetry.lpgLevelPercent}%</span>
          </div>
          <div className='h-2 overflow-hidden rounded-full bg-muted'>
            <div
              className='h-full rounded-full bg-emerald-500'
              style={{ width: `${telemetry.lpgLevelPercent}%` }}
            />
          </div>
        </div>

        {showAlerts ? (
          <div className='mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300'>
            <span className='inline-flex items-center gap-1.5 font-medium'>
              <AlertTriangle className='size-3.5' />
              Pause requise:
            </span>{' '}
            30 min apres 8h de conduite.
          </div>
        ) : null}

        <Button
          type='button'
          variant='outline'
          size='sm'
          className='mt-3 h-8 w-full'
          onClick={() => onViewDetails(truck)}
        >
          Voir les details du camion
        </Button>
      </div>
    </div>
  )
}

function InfoMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex min-w-0 items-center justify-between gap-3'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='truncate text-right font-medium'>{value}</span>
    </div>
  )
}
