import { useTranslation } from 'react-i18next'
import { getRouteApi } from '@tanstack/react-router'
import { Building2, Plus } from 'lucide-react'
import { runMutation } from '@/hooks/use-toast-feedback'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EntityFormSheet, resolveListState, useEntityCrud } from '@/components/entity-crud'
import type { Organization } from '@lpg/types'
import { MarketersTable } from './components/marketers-table'
import { getMarketers } from './data/marketers'
import { marketerFields, marketerFromForm, marketerToForm } from './data/marketers-crud'

const route = getRouteApi('/_authenticated/marketers/')

export function MarketersPage() {
  const { t } = useTranslation('common')
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const crud = useEntityCrud<Organization>('organizations', 'markets', ['organizations'], true)
  const marketers = getMarketers(crud.list.data)
  const hasActiveFilters = Boolean(
    (typeof search.q === 'string' && search.q.trim()) ||
      (Array.isArray(search.status) && search.status.length > 0),
  )
  const listState = resolveListState(crud.list.isLoading, crud.list.isError, marketers.length, hasActiveFilters)

  const handleViewDetails = (marketer: Organization) => {
    navigate({ to: `/marketers/${marketer.id}` })
  }

  async function handleSubmit(values: Record<string, unknown>) {
    const editing = crud.editing
    if (editing) {
      const result = await runMutation(
        () => crud.updateMut.mutateAsync({ id: editing.id, patch: marketerFromForm(values) }),
        t('marketers.updated'),
      )
      if (result.ok) crud.close()
    } else {
      const result = await runMutation(
        () => crud.createMut.mutateAsync(marketerFromForm(values) as Omit<Organization, 'id'>),
        t('marketers.created'),
      )
      if (result.ok) crud.close()
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
          <h1 className='text-2xl font-bold tracking-tight'>{t('marketers.pageTitle')}</h1>
          <Badge variant='outline' className='ml-auto'>
            {marketers.length}
          </Badge>
          {crud.perm.canCreate && (
            <Button onClick={crud.openCreate}>
              <Plus className='mr-1 h-4 w-4' /> {t('marketers.createButton')}
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
          onDelete={async (marketer) => {
            await runMutation(
              () => crud.removeMut.mutateAsync(marketer.id),
              t('entityCrud.deleted'),
            )
          }}
          listState={listState}
          onRetry={() => void crud.list.refetch()}
           deletingId={crud.removeMut.isPending ? crud.removeMut.variables : undefined}

        />
      </section>

      <EntityFormSheet
        open={crud.creating || crud.editing !== null}
        onOpenChange={(open) => {
          if (!open) crud.close()
        }}
        title={crud.editing ? t('marketers.editTitle') : t('marketers.createTitle')}
        description={crud.editing ? t('marketers.editDescription') : t('marketers.createDescription')}
        fields={marketerFields}
        initial={crud.editing ? marketerToForm(crud.editing) : null}
        onSubmit={handleSubmit}
        onCancel={crud.close}
        submitting={crud.createMut.isPending || crud.updateMut.isPending}
      />
    </main>
  )
}
