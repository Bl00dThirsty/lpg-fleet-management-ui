import { useCallback, useMemo, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { CalendarDays, Clock3, Gauge, Plus, Search, Truck as TruckIcon, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TrucksMap } from './components/trucks-map'
import { TrucksTable } from './components/trucks-table'
import { TruckDetailsSheet } from './components/truck-details-sheet'
import {
  getTruckTelemetry as _getTruckTelemetry,
  getTrucks,
  type Truck,
  type TruckStatus,
} from './data/trucks'
import { EntityFormSheet, useEntityCrud } from '@/components/entity-crud'
import { vehicleFields, vehicleFromForm, vehicleToForm } from '@/features/vehicles/data/vehicles-crud'
import type { Vehicle } from '@lpg/types'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'
import { getScope } from '@/features/scope/scope'

export const getTruckTelemetry = _getTruckTelemetry
export type { Truck, TruckStatus }

type TruckFilter = 'all' | TruckStatus

type TruckFilterDef = { label: string; value: TruckFilter; count: number }

const trucksRoute = getRouteApi('/_authenticated/trucks/')

export function TrucksPage() {
  const navigate = trucksRoute.useNavigate()
  const search = trucksRoute.useSearch()
  const { resolvedTheme } = useTheme()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<TruckFilter>('all')
  const [detailsTruck, setDetailsTruck] = useState<Truck | null>(null)
  const user = useAuthStore((s) => s.user)
  const scope = useMemo(() => getScope(user), [user])
  const crud = useEntityCrud<Vehicle>('vehicles', 'trucks', ['vehicles'])
  const trucks = useMemo(() => getTrucks(scope, crud.list.data), [scope, crud.list.data])
  const [activeTruckId, setActiveTruckId] = useState<string>(() => trucks[0]?.id ?? '')

  const handleViewDetails = useCallback((truck: Truck) => {
    setDetailsTruck(truck)
  }, [])

  async function handleSubmit(values: Record<string, unknown>) {
    try {
      if (crud.editing) {
        await crud.updateMut.mutateAsync({ id: crud.editing.id, patch: vehicleFromForm(values) })
        toast.success('Camion mis à jour.')
      } else {
        await crud.createMut.mutateAsync(vehicleFromForm(values) as Omit<Vehicle, 'id'>)
        toast.success('Camion créé.')
      }
      crud.close()
    } catch {
      toast.error('Échec de l’enregistrement.')
    }
  }

  const filteredTrucks = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    if (!query) return [...trucks]
    return trucks.filter((truck) => {
      const haystack = [
        truck.id,
        truck.license_plate,
        truck.assigned_driver,
        truck.region,
        truck.org_id,
        truck.tenant_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [searchText, trucks])

  const visible = statusFilter === 'all' ? filteredTrucks : filteredTrucks.filter((t) => t.tournee_status === statusFilter)

  const filterDefs: TruckFilterDef[] = useMemo(() => {
    const counts: Partial<Record<TruckStatus, number>> = {}
    for (const truck of trucks) {
      counts[truck.tournee_status] = (counts[truck.tournee_status] ?? 0) + 1
    }
    return [
      { label: 'Tous', value: 'all', count: trucks.length },
      { label: 'Planifiee', value: 'PLANNED', count: counts.PLANNED ?? 0 },
      { label: 'En cours', value: 'INPROGRESS', count: counts.INPROGRESS ?? 0 },
      { label: 'Etape atteinte', value: 'CHECKPOINTACTIVE', count: counts.CHECKPOINTACTIVE ?? 0 },
      { label: 'Confirmee', value: 'ACKNOWLEDGED', count: counts.ACKNOWLEDGED ?? 0 },
      { label: 'Attente transporteur', value: 'PENDINGTRANSPORTERACK', count: counts.PENDINGTRANSPORTERACK ?? 0 },
      { label: 'Cloturee', value: 'CLOSED', count: counts.CLOSED ?? 0 },
      { label: 'Annulee', value: 'CANCELLED', count: counts.CANCELLED ?? 0 },
    ]
  }, [trucks])

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

  const avgLpg = useMemo(() => {
    const list = visible.length > 0 ? visible : trucks
    if (list.length === 0) return 0
    const { sum, count } = list.reduce(
      (acc, truck) => {
        const telemetry = getTruckTelemetry(truck.id)
        const max = truck.type === 'VRAC' ? truck.max_volume : truck.max_bottle_count
        if (!max || max <= 0) return acc
        const pct = Math.round(((telemetry.loaded_quantity ?? 0) / max) * 100)
        return { sum: acc.sum + pct, count: acc.count + 1 }
      },
      { sum: 0, count: 0 },
    )
    return count === 0 ? 0 : Math.round(sum / count)
  }, [visible, trucks])

  const selectedTruck =
    visible.find((t) => t.id === activeTruckId) ?? visible[0] ?? trucks[0]
  const mapTheme = resolvedTheme === 'dark' ? 'dark' : 'light'

  const driverCount = useMemo(
    () =>
      new Set(
        trucks
          .map((t) => t.assigned_driver)
          .filter((d): d is string => Boolean(d && d !== '—')),
      ).size,
    [trucks],
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
              icon={TruckIcon}
              label='Actifs'
              value={`${trucks.filter((t) => t.tournee_status === 'INPROGRESS').length}/${trucks.length}`}
            />
            <TopStat
              icon={Users}
              label='Chauffeurs'
              value={`${driverCount}`}
            />
            <TopStat icon={Gauge} label='LPG moyen' value={`${avgLpg}%`} />
            <TopStat icon={Clock3} label='Ponctualite' value="94%" hint="Objectif SLA" />
          </div>

          <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center'>
            {crud.perm.canCreate && (
              <Button onClick={crud.openCreate}>
                <Plus className='mr-1 h-4 w-4' /> Nouveau véhicule
              </Button>
            )}
            <div className='relative w-full sm:w-[310px]'>
              <Search className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder='Rechercher un camion, plaque, chauffeur…'
                className='h-9 ps-9'
              />
            </div>
          </div>
        </div>

        <div className='mt-4 flex flex-col gap-1'>
          <h1 className='text-[30px] leading-none font-semibold tracking-tight sm:text-3xl'>
            Dashboard Operationnel
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

      {selectedTruck ? (
        <section className='relative overflow-hidden rounded-2xl border-transparent bg-muted/70 shadow-sm'>
          <TrucksMap
            sites={[]}
            trucks={visible}
            selectedTruck={selectedTruck}
            mapTheme={mapTheme}
            showRoutes
            onSelectTruck={(truck) => setActiveTruckId(truck.id)}
          />
        </section>
      ) : null}

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
        <div className='flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h2 className='text-xl font-semibold tracking-tight'>Liste des camions</h2>
            <p className='text-sm text-muted-foreground'>
              Selectionnez un camion pour voir sa fiche detaillee, son contrat et
              ses affectations chauffeur/livreur.
            </p>
          </div>
          <Badge
            variant='outline'
            className='border-transparent bg-muted/35 text-foreground'
          >
            {visible.length} / {trucks.length} camions
          </Badge>
        </div>
        <TrucksTable
          data={[...visible]}
          search={search}
          navigate={navigate}
          onViewDetails={handleViewDetails}
          onEdit={(t) => crud.openEdit(t as unknown as Vehicle)}
          onDelete={async (t) => {
            await crud.removeMut.mutateAsync(t.id)
          }}
        />
      </section>

      <TruckDetailsSheet
        truck={detailsTruck}
        open={detailsTruck !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsTruck(null)
        }}
      />

      <EntityFormSheet
        open={crud.creating || crud.editing !== null}
        onOpenChange={(open) => {
          if (!open) crud.close()
        }}
        title={crud.editing ? 'Modifier le camion' : 'Nouveau camion'}
        description={crud.editing ? 'Mettez à jour les informations du camion.' : 'Ajoutez un camion à la flotte.'}
        fields={vehicleFields}
        initial={crud.editing ? vehicleToForm(crud.editing) : null}
        onSubmit={handleSubmit}
        onCancel={crud.close}
        submitting={crud.createMut.isPending || crud.updateMut.isPending}
      />
    </main>
  )
}

function TopStat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div
      className='inline-flex items-center gap-1.5 rounded-full border-transparent bg-background/90 px-2.5 py-1 text-xs shadow-xs'
      title={hint}
    >
      <Icon className='size-3.5 text-primary' />
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
