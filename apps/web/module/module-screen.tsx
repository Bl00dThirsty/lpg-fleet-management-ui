import { useMemo } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { type Role } from '@/config/rbac/roles'
import { MODULE_REGISTRY } from '@/config/modules/registry'
import { moduleKey } from '@/config/modules/types'
import { buildColumns } from '@/module/build-columns'
import { generateMockRows } from '@/module/mock-data'
import { DataTable, type FacetedFilterConfig } from '@lpg/ui'
import { PageHeader } from '@/components/layout/page-header'
import { EmptyState, PageShell, SectionCard } from '@/components/layout/page'
import { ModuleBulkActions } from '@/module/module-bulk-actions'

export function ModuleScreen({ role, module }: { role: Role; module: string }) {
  const route = getRouteApi('/_authenticated/$role/$module')
  const search = route.useSearch() as Record<string, unknown>
  const navigate = route.useNavigate()
  const def = MODULE_REGISTRY[moduleKey(role, module)]

  const data = useMemo(() => (def ? generateMockRows(def) : []), [def])
  const columns = useMemo(() => (def ? buildColumns(def.fields) : []), [def])
  const facetedFilters = useMemo<FacetedFilterConfig[]>(() => {
    if (!def) return []
    return def.fields
      .filter((f) => f.filterable && (f.type === 'badge' || f.type === 'status') && f.options)
      .map((f) => ({
        columnId: f.key,
        title: f.header,
        options: f.options!.map((o) => ({ label: o.label, value: o.value })),
      }))
  }, [def])
  const groupableColumns = useMemo(
    () => (def ? def.fields.filter((f) => f.groupable).map((f) => ({ columnId: f.key, title: f.header })) : []),
    [def]
  )
  const dateField = def?.fields.find((f) => f.type === 'date')

  if (!def) {
    return (
      <PageShell>
        <PageHeader title={module} description='Module non configuré.' />
        <EmptyState
          title='Aucune définition de table'
          description='Aucune définition de table pour ce module.'
        />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader title={def.title} description={def.description} />
      <SectionCard>
        <DataTable
          data={data}
          columns={columns}
          search={{ placeholder: `Rechercher ${def.title.toLowerCase()}...`, searchKey: 'q' }}
          facetedFilters={facetedFilters}
          groupableColumns={groupableColumns}
          dateFilter={
            dateField
              ? {
                  columnId: dateField.key,
                  searchKeyFrom: `${dateField.key}From`,
                  searchKeyTo: `${dateField.key}To`,
                  getRowDate: (row) => row[dateField.key] as string | Date,
                  placeholder: `Filtrer par ${dateField.header.toLowerCase()}`,
                }
              : undefined
          }
          filename={module}
          searchState={search}
          navigate={navigate}
          renderBulkActions={({ table }) => (
            <ModuleBulkActions table={table} entityName='élément' />
          )}
        />
      </SectionCard>
    </PageShell>
  )
}
