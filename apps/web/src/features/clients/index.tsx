import { getRouteApi } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@lpg/ui'
import { useCallback, useState } from 'react'
import { PageShell, SectionCard } from '@/components/layout/page'
import { PageHeader } from '@/components/layout/page-header'
import { EntityFormSheet, useEntityCrud } from '@/components/entity-crud'
import { ClientsTable } from './components/clients-table'
import { ClientDetailsSheet } from './components/client-details-sheet'
import { getClients } from './data/clients'
import type { ClientView } from './data/clients'
import { clientFields, clientFromForm, clientToForm } from './data/clients-crud'
import type { Client } from '@lpg/types'
import { toast } from 'sonner'

const route = getRouteApi('/_authenticated/clients/')

export function ClientsPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [detailsClient, setDetailsClient] = useState<ClientView | null>(null)
  const crud = useEntityCrud<Client>('clients', 'clients', ['clients'])

  const handleViewDetails = useCallback((client: ClientView) => {
    setDetailsClient(client)
  }, [])

  async function handleSubmit(values: Record<string, unknown>) {
    try {
      if (crud.editing) {
        await crud.updateMut.mutateAsync({ id: crud.editing.id, patch: clientFromForm(values) })
        toast.success('Client mis à jour.')
      } else {
        await crud.createMut.mutateAsync(clientFromForm(values) as Omit<Client, 'id'>)
        toast.success('Client créé.')
      }
      crud.close()
    } catch {
      toast.error('Échec de l’enregistrement.')
    }
  }

  const clients = getClients(crud.list.data)

  return (
    <PageShell>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <PageHeader
          title='Clients et sites de livraison'
          description='Référentiel des clients distributeurs, contrats associés et points de livraison.'
        />
        {crud.perm.canCreate && (
          <Button onClick={crud.openCreate} className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            Ajouter un client
          </Button>
        )}
      </div>

      <SectionCard>
        <ClientsTable
          data={clients}
          search={search}
          navigate={navigate}
          onViewDetails={handleViewDetails}
          onEdit={(c) => crud.openEdit(c as unknown as Client)}
          onDelete={(c) => crud.removeMut.mutateAsync(c.id)}
        />
      </SectionCard>

      <ClientDetailsSheet
        client={detailsClient}
        open={detailsClient !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsClient(null)
        }}
      />

      <EntityFormSheet
        open={crud.creating || crud.editing !== null}
        onOpenChange={(open) => {
          if (!open) crud.close()
        }}
        title={crud.editing ? 'Modifier le client' : 'Ajouter un client'}
        description={crud.editing ? 'Mettez à jour les informations du client.' : 'Créez un nouveau client distributeur.'}
        fields={clientFields}
        initial={crud.editing ? clientToForm(crud.editing) : null}
        onSubmit={handleSubmit}
        onCancel={crud.close}
        submitting={crud.createMut.isPending || crud.updateMut.isPending}
      />
    </PageShell>
  )
}
