import { getRouteApi } from '@tanstack/react-router'
import { MapPinned, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCallback, useState } from 'react'
import { EntityFormSheet, useEntityCrud } from '@/components/entity-crud'
import type { RegionEntity } from '@lpg/types'
import { ZonesTable } from './components/zones-table'
import { ZoneDetailsSheet } from './components/zone-details-sheet'
import { getZones } from './data/zones'
import type { ZoneView } from './data/zones'
import { zoneFields, zoneFromForm, zoneToForm } from './data/zones-crud'
import { toast } from 'sonner'
import { extractErrorMessage } from '@/hooks/use-toast-feedback'

const route = getRouteApi('/_authenticated/zones/')

export function ZonesPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [detailsZone, setDetailsZone] = useState<ZoneView | null>(null)
  const crud = useEntityCrud<RegionEntity>('regions', 'zones', ['regions'])
  const derivedZones = getZones()
  const derivedById = new Map(derivedZones.map((zone) => [zone.id, zone]))
  const zones = (crud.list.data ?? derivedZones).map((region) => {
    const derived = derivedById.get(region.id)
    return {
      id: region.id,
      code: region.code,
      name: region.name,
      siteCount: derived?.siteCount ?? 0,
      clientSiteCount: derived?.clientSiteCount ?? 0,
      region: region.code,
    }
  })

  const handleViewDetails = useCallback((zone: ZoneView) => {
    setDetailsZone(zone)
  }, [])

  const handleViewMap = useCallback((zone: ZoneView): void => {
    void navigate({ to: '/map', search: { zone: zone.code } })
  }, [navigate])

  async function handleSubmit(values: Record<string, unknown>) {
    try {
      if (crud.editing) {
        await crud.updateMut.mutateAsync({ id: crud.editing.id, patch: zoneFromForm(values) })
        toast.success('Zone mise à jour.')
      } else {
        await crud.createMut.mutateAsync(zoneFromForm(values) as Omit<RegionEntity, 'id'>)
        toast.success('Zone créée.')
      }
      crud.close()
    } catch (error) {
      toast.error(extractErrorMessage(error))
    }
  }

  return (
    <main
      id='main-content'
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <section className='rounded-2xl border-transparent bg-background/88 p-3 shadow-sm backdrop-blur-sm sm:p-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <MapPinned className='h-6 w-6 text-primary' />
          <h1 className='text-2xl font-bold tracking-tight'>Zones</h1>
          <Badge variant='outline' className='ml-auto'>
            {zones.length}
          </Badge>
          {crud.perm.canCreate && (
            <Button onClick={crud.openCreate}>
              <Plus className='mr-1 h-4 w-4' /> Nouvelle zone
            </Button>
          )}
        </div>
      </section>

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
        <ZonesTable
          data={zones}
          search={search}
          navigate={navigate}
          onViewDetails={handleViewDetails}
          onViewMap={handleViewMap}
          onEdit={(zone) => crud.openEdit(zone as RegionEntity)}
          onDelete={(zone) => crud.removeMut.mutateAsync(zone.id)}
          canDelete={crud.perm.canDelete}
        />
      </section>

      <ZoneDetailsSheet
        zone={detailsZone}
        open={detailsZone !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsZone(null)
        }}
      />

      <EntityFormSheet
        open={crud.creating || crud.editing !== null}
        onOpenChange={(open) => {
          if (!open) crud.close()
        }}
        title={crud.editing ? 'Modifier la zone' : 'Nouvelle zone'}
        description={crud.editing ? 'Mettez à jour les informations de la zone.' : 'Créez une nouvelle zone.'}
        fields={zoneFields}
        initial={crud.editing ? zoneToForm(crud.editing) : null}
        onSubmit={handleSubmit}
        onCancel={crud.close}
        submitting={crud.createMut.isPending || crud.updateMut.isPending}
      />
    </main>
  )
}
