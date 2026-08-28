import { getRouteApi } from '@tanstack/react-router'
import { Building2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EntityFormSheet, useEntityCrud } from '@/components/entity-crud'
import type { Organization } from '@lpg/types'
import { MarketersTable } from './components/marketers-table'
import { getMarketers } from './data/marketers'
import { marketerFields, marketerFromForm, marketerToForm } from './data/marketers-crud'

const route = getRouteApi('/_authenticated/marketers/')

export function MarketersPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const crud = useEntityCrud<Organization>('organizations', 'markets', ['organizations'])
  const marketers = getMarketers(crud.list.data)

  const handleViewDetails = (marketer: Organization) => {
    navigate({ to: `/marketers/${marketer.id}` })
  }

  async function handleSubmit(values: Record<string, unknown>) {
    try {
      if (crud.editing) {
        await crud.updateMut.mutateAsync({ id: crud.editing.id, patch: marketerFromForm(values) })
        toast.success('Marketeur mis à jour.')
      } else {
        await crud.createMut.mutateAsync(marketerFromForm(values) as Omit<Organization, 'id'>)
        toast.success('Marketeur créé.')
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
          <Building2 className='h-6 w-6 text-primary' />
          <h1 className='text-2xl font-bold tracking-tight'>Marketeurs</h1>
          <Badge variant='outline' className='ml-auto'>
            {marketers.length}
          </Badge>
          {crud.perm.canCreate && (
            <Button onClick={crud.openCreate}>
              <Plus className='mr-1 h-4 w-4' /> Nouveau marketeur
            </Button>
          )}
        </div>
      </section>

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
        <MarketersTable
          data={marketers}
          search={search}
          navigate={navigate}
          onViewDetails={handleViewDetails}
          onEdit={(m) => crud.openEdit(m)}
          onDelete={(m) => crud.removeMut.mutateAsync(m.id)}
        />
      </section>

      <EntityFormSheet
        open={crud.creating || crud.editing !== null}
        onOpenChange={(open) => {
          if (!open) crud.close()
        }}
        title={crud.editing ? 'Modifier le marketeur' : 'Nouveau marketeur'}
        description={crud.editing ? 'Mettez à jour les informations du marketeur.' : 'Créez un nouveau marketeur.'}
        fields={marketerFields}
        initial={crud.editing ? marketerToForm(crud.editing) : null}
        onSubmit={handleSubmit}
        onCancel={crud.close}
        submitting={crud.createMut.isPending || crud.updateMut.isPending}
      />
    </main>
  )
}
