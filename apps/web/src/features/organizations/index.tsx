import { getRouteApi } from '@tanstack/react-router'
import { Building2, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCallback, useState } from 'react'
import { EntityFormSheet, useEntityCrud, useCrud } from '@/components/entity-crud'
import { OrganizationsTable } from './components/organizations-table'
import { OrganizationDetailsSheet } from './components/organization-details-sheet'
import { getOrganizations } from './data/organizations'
import type { Organization } from './data/organizations'
import {
  organizationEditFields,
  organizationFields,
  organizationFromForm,
  organizationToForm,
  siteFromForm,
} from './data/organizations-crud'
import type { Organization as CuratedOrganization, Site as CuratedSite } from '@lpg/types'
import { toast } from 'sonner'

const route = getRouteApi('/_authenticated/organizations/')

export function OrganizationsPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [detailsOrg, setDetailsOrg] = useState<Organization | null>(null)
  const crud = useEntityCrud<CuratedOrganization>('organizations', 'orgs', ['organizations'])
  const siteCrud = useCrud<CuratedSite>('sites', {
    permissionResource: 'sites',
    queryKey: ['sites'],
  })
  const orgs = getOrganizations(crud.list.data)

  const handleViewDetails = useCallback((org: Organization) => {
    setDetailsOrg(org)
  }, [])

  async function handleSubmit(values: Record<string, unknown>) {
    try {
      if (crud.editing) {
        await crud.updateMut.mutateAsync({
          id: crud.editing.id,
          patch: organizationFromForm(values),
        })
        toast.success('Organisation mise à jour.')
      } else {
        const org = await crud.createMut.mutateAsync(
          organizationFromForm(values) as Omit<CuratedOrganization, 'id'>,
        )
        const site = siteFromForm(values, org.id)
        if (site) {
          await siteCrud.createMut.mutateAsync(site)
        }
        toast.success(site ? 'Organisation et site créés.' : 'Organisation créée.')
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
          <h1 className='text-2xl font-bold tracking-tight'>Organisations</h1>
          <Badge variant='outline' className='ml-auto'>
            {orgs.length}
          </Badge>
          {crud.perm.canCreate && (
            <Button onClick={crud.openCreate}>
              <Plus className='mr-1 h-4 w-4' /> Nouvelle organisation
            </Button>
          )}
        </div>
      </section>

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
        <OrganizationsTable
          data={orgs}
          search={search}
          navigate={navigate}
          onViewDetails={handleViewDetails}
          onEdit={(org) => crud.openEdit(org as unknown as CuratedOrganization)}
          onDelete={(org) => crud.removeMut.mutateAsync(org.id)}
        />
      </section>

      <OrganizationDetailsSheet
        org={detailsOrg}
        open={detailsOrg !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsOrg(null)
        }}
      />

      <EntityFormSheet
        open={crud.creating || crud.editing !== null}
        onOpenChange={(open) => {
          if (!open) crud.close()
        }}
        title={crud.editing ? 'Modifier l’organisation' : 'Nouvelle organisation'}
        description={
          crud.editing
            ? 'Mettez à jour les informations de l’organisation.'
            : 'Créez une nouvelle organisation.'
        }
        fields={crud.editing ? organizationEditFields : organizationFields}
        initial={crud.editing ? organizationToForm(crud.editing) : null}
        onSubmit={handleSubmit}
        onCancel={crud.close}
        submitting={crud.createMut.isPending || crud.updateMut.isPending}
      />
    </main>
  )
}
