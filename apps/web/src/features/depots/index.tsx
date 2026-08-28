import { getRouteApi } from '@tanstack/react-router'
import { Plus, Warehouse } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCallback, useState } from 'react'
import { EntityFormSheet, useEntityCrud } from '@/components/entity-crud'
import { DepotsTable } from './components/depots-table'
import { DepotDetailsSheet } from './components/depot-details-sheet'
import { getDepots } from './data/depots'
import type { DepotView } from './data/depots'
import { depotFields, depotFromForm, depotToForm } from './data/depots-crud'
import type { Organization } from '@lpg/types'
import { toast } from 'sonner'

const route = getRouteApi('/_authenticated/depots/')

export function DepotsPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [detailsDepot, setDetailsDepot] = useState<DepotView | null>(null)
  const crud = useEntityCrud<Organization>('organizations', 'orgs', ['organizations'])
  const depots = getDepots(crud.list.data)

  const handleViewDetails = useCallback((depot: DepotView) => {
    setDetailsDepot(depot)
  }, [])

  async function handleSubmit(values: Record<string, unknown>) {
    try {
      if (crud.editing) {
        await crud.updateMut.mutateAsync({ id: crud.editing.id, patch: depotFromForm(values) })
        toast.success('Dépôt mis à jour.')
      } else {
        await crud.createMut.mutateAsync(depotFromForm(values) as Omit<Organization, 'id'>)
        toast.success('Dépôt créé.')
      }
      crud.close()
    } catch {
      toast.error('Échec de l’enregistrement.')
    }
  }

  return (
    <main
      id='main-content'
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <section className='rounded-2xl border-transparent bg-background/88 p-3 shadow-sm backdrop-blur-sm sm:p-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <Warehouse className='h-6 w-6 text-primary' />
          <h1 className='text-2xl font-bold tracking-tight'>Dépôts</h1>
          <Badge variant='outline' className='ml-auto'>
            {depots.length}
          </Badge>
          {crud.perm.canCreate && (
            <Button onClick={crud.openCreate}>
              <Plus className='mr-1 h-4 w-4' /> Nouveau dépôt
            </Button>
          )}
        </div>
      </section>

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
        <DepotsTable
          data={depots}
          search={search}
          navigate={navigate}
          onViewDetails={handleViewDetails}
          onEdit={(d) => crud.openEdit(d as unknown as Organization)}
          onDelete={(d) => crud.removeMut.mutateAsync(d.id)}
        />
      </section>

      <DepotDetailsSheet
        depot={detailsDepot}
        open={detailsDepot !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsDepot(null)
        }}
      />

      <EntityFormSheet
        open={crud.creating || crud.editing !== null}
        onOpenChange={(open) => {
          if (!open) crud.close()
        }}
        title={crud.editing ? 'Modifier le dépôt' : 'Nouveau dépôt'}
        description={crud.editing ? 'Mettez à jour les informations du dépôt.' : 'Créez un nouveau dépôt.'}
        fields={depotFields}
        initial={crud.editing ? depotToForm(crud.editing) : null}
        onSubmit={handleSubmit}
        onCancel={crud.close}
        submitting={crud.createMut.isPending || crud.updateMut.isPending}
      />
    </main>
  )
}
