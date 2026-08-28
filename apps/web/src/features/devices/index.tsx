import { useCallback, useMemo, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { CalendarDays, Cpu, Plus, Radio, Search, Truck, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DevicesTable } from './components/devices-table'
import { DeviceDetailsSheet } from './components/device-details-sheet'
import {
  getAssignmentsCount,
  getDevicesView as _getDevicesView,
  devices as devicesList,
  type Device,
  type DeviceView,
} from './data/devices'
import type { DeviceStatus } from '@lpg/types'
import { type DeviceBulkAction } from './components/data-table-bulk-actions'
import { EntityFormSheet, useEntityCrud } from '@/components/entity-crud'
import { deviceFields, deviceFromForm, deviceToForm } from './data/devices-crud'
import { toast } from 'sonner'

export const getDevicesView = _getDevicesView
export const devices: readonly Device[] = devicesList
export type { Device, DeviceView }

type DeviceFilter = 'all' | 'GPS' | 'PDA' | 'RFIDREADER'

type DeviceFilterDef = {
  label: string
  value: DeviceFilter
  count: number
}

const devicesRoute = getRouteApi('/_authenticated/devices/')

export function DevicesPage() {
  const navigate = devicesRoute.useNavigate()
  const search = devicesRoute.useSearch()
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState<DeviceFilter>('all')
  const [detailsDevice, setDetailsDevice] = useState<DeviceView | null>(null)
  const crud = useEntityCrud<Device>('devices', 'devices', ['devices'])

  const allDevices = getDevicesView(crud.list.data)

  const handleViewDetails = useCallback((device: DeviceView) => {
    setDetailsDevice(device)
  }, [])

  async function handleSubmit(values: Record<string, unknown>) {
    try {
      if (crud.editing) {
        await crud.updateMut.mutateAsync({ id: crud.editing.id, patch: deviceFromForm(values) })
        toast.success('Appareil mis à jour.')
      } else {
        await crud.createMut.mutateAsync(deviceFromForm(values) as Omit<Device, 'id'>)
        toast.success('Appareil créé.')
      }
      crud.close()
    } catch {
      toast.error('Échec de l’enregistrement.')
    }
  }

  const filteredDevices = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    const haystackDevices = query
      ? allDevices.filter((device) => {
          const haystack = [
            device.serial,
            device.orgName,
            device.vehiclePlate,
            device.driverName,
            device.imei,
            device.model,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return haystack.includes(query)
        })
      : allDevices
    if (typeFilter === 'all') return haystackDevices
    return haystackDevices.filter((device) => device.type === typeFilter)
  }, [searchText, typeFilter, allDevices])

  const handleBulk = useCallback(
    async (action: DeviceBulkAction, selected: DeviceView[]) => {
      if (selected.length === 0) {
        toast.info('Sélectionnez au moins un appareil.')
        return
      }
      if (action === 'export') {
        exportDevicesCsv(selected)
        toast.success(`${selected.length} appareil(s) exporté(s) en CSV.`)
        return
      }
      const statusByAction: Record<'sync' | 'activate' | 'maintenance', DeviceStatus> = {
        sync: 'SYNCED',
        activate: 'DEPLOYED',
        maintenance: 'MAINTENANCE',
      }
      const targetStatus = statusByAction[action]
      try {
        await Promise.all(
          selected.map((device) =>
            crud.updateMut.mutateAsync({
              id: device.id,
              patch: { status: targetStatus },
            }),
          ),
        )
        toast.success(
          `${selected.length} appareil(s) ${action === 'sync' ? 'synchronisé(s)' : action === 'activate' ? 'activé(s)' : 'passé(s) en maintenance'}.`,
        )
      } catch {
        toast.error('Échec de la mise à jour des appareils.')
      }
    },
    [crud],
  )

  const assignments = getAssignmentsCount()

  const filterDefs: DeviceFilterDef[] = useMemo(() => {
    const counts = allDevices.reduce<Record<string, number>>((acc, device) => {
      acc[device.type] = (acc[device.type] ?? 0) + 1
      return acc
    }, {})
    return [
      { label: 'Tous', value: 'all', count: allDevices.length },
      { label: 'GPS', value: 'GPS', count: counts.GPS ?? 0 },
      { label: 'PDA', value: 'PDA', count: counts.PDA ?? 0 },
      {
        label: 'Lecteurs RFID',
        value: 'RFIDREADER',
        count: counts.RFIDREADER ?? 0,
      },
    ]
  }, [allDevices])

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
              icon={Cpu}
              label='Appareils'
              value={`${allDevices.length}`}
            />
            <TopStat
              icon={Radio}
              label='Connectés'
              value={`${assignments.assigned}/${assignments.total}`}
              hint='Appareils affectés à un véhicule ou un chauffeur'
            />
            <TopStat
              icon={Truck}
              label='Véhicules suivis'
              value={`${allDevices.filter((d) => d.vehiclePlate).length}`}
            />
            <TopStat
              icon={Users}
              label='Chauffeurs équipés'
              value={`${allDevices.filter((d) => d.driverName).length}`}
            />
          </div>

          <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center'>
            {crud.perm.canCreate && (
              <Button onClick={crud.openCreate}>
                <Plus className='mr-1 h-4 w-4' /> Nouvel appareil
              </Button>
            )}
            <div className='relative w-full sm:w-[310px]'>
              <Search className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder='Rechercher un appareil, org, camion…'
                className='h-9 ps-9'
              />
            </div>
          </div>
        </div>

        <div className='mt-4 flex flex-col gap-1'>
          <h1 className='text-[30px] leading-none font-semibold tracking-tight sm:text-3xl'>
            Registre des appareils
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
              active={typeFilter === filter.value}
              onClick={() => setTypeFilter(filter.value)}
            />
          ))}
        </div>
      </section>

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
        <div className='flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h2 className='text-xl font-semibold tracking-tight'>
              Liste des appareils
            </h2>
            <p className='text-sm text-muted-foreground'>
              Selectionnez un appareil pour voir sa fiche detaillee (batterie,
              position, configuration, telecom).
            </p>
          </div>
          <Badge
            variant='outline'
            className='border-transparent bg-muted/35 text-foreground'
          >
            {filteredDevices.length} / {allDevices.length} appareils
          </Badge>
        </div>
        <DevicesTable
          data={[...filteredDevices]}
          search={search}
          navigate={navigate}
          onViewDetails={handleViewDetails}
          canWrite={crud.perm.canWrite}
          onBulk={handleBulk}
          onEdit={(d) => crud.openEdit(d as unknown as Device)}
          onDelete={async (d) => {
            await crud.removeMut.mutateAsync(d.id)
          }}
        />
      </section>

      <DeviceDetailsSheet
        device={detailsDevice}
        open={detailsDevice !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsDevice(null)
        }}
      />

      <EntityFormSheet
        open={crud.creating || crud.editing !== null}
        onOpenChange={(open) => {
          if (!open) crud.close()
        }}
        title={crud.editing ? 'Modifier l’appareil' : 'Nouvel appareil'}
        description={crud.editing ? 'Mettez à jour les informations de l’appareil.' : 'Ajoutez un appareil au registre.'}
        fields={deviceFields}
        initial={crud.editing ? deviceToForm(crud.editing) : null}
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

function exportDevicesCsv(devices: DeviceView[]) {
  const header = [
    'N° série',
    'Type',
    'Statut',
    'Organisation',
    'Véhicule',
    'Chauffeur',
    'IMEI',
    'Modèle',
    'Firmware',
    'Batterie',
  ]
  const rows = devices.map((d) => [
    d.serial,
    d.type,
    d.status,
    d.orgName,
    d.vehiclePlate ?? '',
    d.driverName ?? '',
    d.imei ?? '',
    d.model ?? '',
    d.firmware ?? '',
    d.batteryStatus ?? '',
  ])
  const csv = [header, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).split('"').join('""')}"`)
        .join(';'),
    )
    .join('\r\n')
  const blob = new Blob([`\ufeff${csv}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `appareils-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
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