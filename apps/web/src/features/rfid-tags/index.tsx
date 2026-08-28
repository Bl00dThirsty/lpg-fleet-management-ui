import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { RfidTagsTable } from './components/rfid-tags-table'
import { RfidTagDetailsSheet } from './components/rfid-tag-details-sheet'
import {
  getRfidTags as _getRfidTags,
  getRfidTagsView,
  rfidTagStatusLabels,
  rfidTagStatusOptions,
  type RfidTagView,
} from './data/rfid-tags'
import { EntityFormSheet, useEntityCrud } from '@/components/entity-crud'
import { rfidTagFields, rfidTagFromForm, rfidTagToForm } from './data/rfid-tags-crud'
import type { RfidTag } from '@lpg/types'
import { toast } from 'sonner'

export const getRfidTags = _getRfidTags
export type { RfidTag } from '@lpg/types'

type RfidTagFilter = 'all' | string

type RfidTagFilterDef = { label: string; value: string; count: number }

const ALL_STATUSES = rfidTagStatusOptions.map((option) => option.value)

export function RfidTagsPage() {
  const crud = useEntityCrud<RfidTag>('rfidTags', 'rfid', ['rfid-tags'])
  const tags = useMemo(() => getRfidTagsView(crud.list.data ?? _getRfidTags()), [crud.list.data])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<RfidTagFilter>('all')
  const [detailsTag, setDetailsTag] = useState<RfidTagView | null>(null)

  const handleViewDetails = (tag: RfidTagView) => setDetailsTag(tag)

  async function handleSubmit(values: Record<string, unknown>) {
    try {
      if (crud.editing) {
        await crud.updateMut.mutateAsync({ id: crud.editing.id, patch: rfidTagFromForm(values) })
        toast.success('Tag RFID mis à jour.')
      } else {
        await crud.createMut.mutateAsync(rfidTagFromForm(values) as Omit<RfidTag, 'id'>)
        toast.success('Tag RFID créé.')
      }
      crud.close()
    } catch {
      toast.error('Échec de l’enregistrement.')
    }
  }

  const filteredTags = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return tags
    return tags.filter((tag) => {
      const haystack = [tag.tag_id, tag.bottle_serial, tag.location]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [tags, search])

  const visible =
    statusFilter === 'all'
      ? filteredTags
      : filteredTags.filter((tag) => tag.status === statusFilter)

  const filterDefs: RfidTagFilterDef[] = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const tag of tags) {
      counts[tag.status] = (counts[tag.status] ?? 0) + 1
    }
    return [
      { label: 'Tous', value: 'all', count: tags.length },
      ...ALL_STATUSES.map((status) => ({
        label: rfidTagStatusLabels[status as keyof typeof rfidTagStatusLabels],
        value: status,
        count: counts[status] ?? 0,
      })),
    ]
  }, [tags])

  return (
    <main
      id='main-content'
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 text-sm sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <section className='rounded-2xl border-transparent bg-background/88 p-3 shadow-sm backdrop-blur-sm sm:p-4'>
        <div className='flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge
              variant='outline'
              className='border-transparent bg-background/90 px-3 py-1.5 text-xs shadow-xs'
            >
              {tags.length} tags RFID
            </Badge>
          </div>

          <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center'>
            {crud.perm.canCreate && (
              <Button onClick={crud.openCreate}>
                <Plus className='mr-1 h-4 w-4' /> Nouveau tag
              </Button>
            )}
            <div className='relative w-full sm:w-[310px]'>
              <Search className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Rechercher tag RFID, bouteille, localisation…'
                className='h-9 ps-9'
              />
            </div>
          </div>
        </div>

        <div className='mt-4 flex flex-col gap-1'>
          <h1 className='text-[30px] leading-none font-semibold tracking-tight sm:text-3xl'>
            Registre des tags RFID
          </h1>
          <p className='inline-flex items-center gap-2 text-xs text-muted-foreground sm:text-sm'>
            Suivi du parc de tags RFID, de leur affectation à une bouteille et de
            leur état de circulation.
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

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
        <div className='flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h2 className='text-xl font-semibold tracking-tight'>
              Liste des tags RFID
            </h2>
            <p className='text-sm text-muted-foreground'>
              Selectionnez un tag pour voir sa fiche detaillee et son
              affectation.
            </p>
          </div>
          <Badge
            variant='outline'
            className='border-transparent bg-muted/35 text-foreground'
          >
            {visible.length} / {tags.length} tags
          </Badge>
        </div>
        <RfidTagsTable
          data={visible}
          onOpenDetails={handleViewDetails}
          onEdit={(t) => crud.openEdit(t as unknown as RfidTag)}
          onDelete={(t) => crud.removeMut.mutateAsync(t.tag.id)}
        />
      </section>

      <RfidTagDetailsSheet
        tag={detailsTag}
        open={detailsTag !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsTag(null)
        }}
      />

      <EntityFormSheet
        open={crud.creating || crud.editing !== null}
        onOpenChange={(open) => {
          if (!open) crud.close()
        }}
        title={crud.editing ? 'Modifier le tag RFID' : 'Nouveau tag RFID'}
        description={crud.editing ? 'Mettez à jour les informations du tag.' : 'Ajoutez un tag RFID au registre.'}
        fields={rfidTagFields}
        initial={crud.editing ? rfidTagToForm(crud.editing) : null}
        onSubmit={handleSubmit}
        onCancel={crud.close}
        submitting={crud.createMut.isPending || crud.updateMut.isPending}
      />
    </main>
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