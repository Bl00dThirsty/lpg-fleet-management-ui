import { getRouteApi } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@lpg/ui'
import { useCallback } from 'react'
import { PageShell, SectionCard } from '@/components/layout/page'
import { PageHeader } from '@/components/layout/page-header'
import { useEntityCrud } from '@/components/entity-crud'
import { ClientsTable } from './components/clients-table'
import { useClientDirectory } from './data/use-client-directory'
import { getClients } from './data/clients'
import type { ClientView } from './data/clients'
import type { Client } from '@lpg/types'

const route = getRouteApi('/_authenticated/clients/')

export function ClientsPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const crud = useEntityCrud<Client>('clients', 'clients', ['clients'])

  const handleViewDetails = useCallback(
    (client: ClientView) => {
      navigate({
        to: '/clients/$clientId',
        params: { clientId: client.id },
      })
    },
    [navigate]
  )

  const directory = useClientDirectory()
  const clients = getClients(
    directory.clients,
    directory.organizations,
    directory.sites
  )

  return (
    <PageShell>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <PageHeader
          title='Clients et sites de livraison'
          description='Référentiel des clients distributeurs, contrats associés et points de livraison.'
        />
        {crud.perm.canCreate && (
          <Button
            onClick={() => navigate({ to: '/clients/new' })}
            className='flex items-center gap-2'
          >
            <Plus className='h-4 w-4' />
            Nouveau client
          </Button>
        )}
      </div>

      <SectionCard>
        {directory.isLoading ? (
          <p role='status'>Chargement des clients et de leurs sites…</p>
        ) : directory.isError ? (
          <div role='alert'>
            Impossible de charger les clients.{' '}
            <Button variant='outline' onClick={() => void directory.refetch()}>
              Réessayer
            </Button>
          </div>
        ) : (
          <ClientsTable
            data={clients}
            search={search}
            navigate={navigate}
            onViewDetails={handleViewDetails}
            onDelete={(c) => crud.removeMut.mutateAsync(c.id)}
          />
        )}
      </SectionCard>
    </PageShell>
  )
}
