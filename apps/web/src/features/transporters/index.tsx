import { getRouteApi } from '@tanstack/react-router'
import { Plus, Truck as TruckIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EntityFormSheet, useEntityCrud } from '@/components/entity-crud'
import { useAuthStore } from '@/store/auth-store'
import type { Organization } from '@lpg/types'
import { TransportersTable } from './components/transporters-table'
import { getTransporters } from './transporters'
import { transporterFields, transporterFromForm, transporterToForm } from './data/transporters-crud'

const route = getRouteApi('/_authenticated/transporters/')

export function TransportersPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const crud = useEntityCrud<Organization>('organizations', 'transporters', ['organizations'])
  const allTransporters = getTransporters(crud.list.data)
  const user = useAuthStore((s) => s.user)
  const role = user?.system_role ?? 'LIVREUR'
  // FILTER: TRANSPORTEUR only sees their own org's transporters
  const transporters = role !== 'TRANSPORTEUR'
    ? allTransporters
    : allTransporters.filter((t) => t.id === (user?.org_id ?? ''))

  const handleViewDetails = (transporter: Organization) => {
    navigate({ to: `/transporters/${transporter.id}` })
  }

  async function handleSubmit(values: Record<string, unknown>) {
    try {
      if (crud.editing) {
        await crud.updateMut.mutateAsync({ id: crud.editing.id, patch: transporterFromForm(values) })
        toast.success('Transporteur mis à jour.')
      } else {
        await crud.createMut.mutateAsync(transporterFromForm(values) as Omit<Organization, 'id'>)
        toast.success('Transporteur créé.')
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
          <TruckIcon className='h-6 w-6 text-primary' />
          <h1 className='text-2xl font-bold tracking-tight'>Transporteurs</h1>
          <Badge variant='outline' className='ml-auto'>
            {transporters.length}
          </Badge>
          {crud.perm.canCreate && (
            <Button onClick={crud.openCreate}>
              <Plus className='mr-1 h-4 w-4' /> Nouveau transporteur
            </Button>
          )}
        </div>
      </section>

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
        <TransportersTable
          data={transporters}
          search={search}
          navigate={navigate}
          onViewDetails={handleViewDetails}
          onEdit={(t) => crud.openEdit(t)}
          onDelete={(t) => crud.removeMut.mutateAsync(t.id)}
        />
      </section>

      <EntityFormSheet
        open={crud.creating || crud.editing !== null}
        onOpenChange={(open) => {
          if (!open) crud.close()
        }}
        title={crud.editing ? 'Modifier le transporteur' : 'Nouveau transporteur'}
        description={crud.editing ? 'Mettez à jour les informations du transporteur.' : 'Créez un nouveau transporteur.'}
        fields={transporterFields}
        initial={crud.editing ? transporterToForm(crud.editing) : null}
        onSubmit={handleSubmit}
        onCancel={crud.close}
        submitting={crud.createMut.isPending || crud.updateMut.isPending}
      />
    </main>
  )
}
