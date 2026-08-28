import { getRouteApi } from '@tanstack/react-router'
import { Plus, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCallback, useState } from 'react'
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
    <main
      id='main-content'
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <section className='rounded-2xl border-transparent bg-background/88 p-3 shadow-sm backdrop-blur-sm sm:p-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <Users className='h-6 w-6 text-primary' />
          <h1 className='text-2xl font-bold tracking-tight'>Clients</h1>
          <Badge variant='outline' className='ml-auto'>
            {clients.length}
          </Badge>
          {crud.perm.canCreate && (
            <Button onClick={crud.openCreate}>
              <Plus className='mr-1 h-4 w-4' /> Nouveau client
            </Button>
          )}
        </div>
      </section>

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
        <ClientsTable
          data={clients}
          search={search}
          navigate={navigate}
          onViewDetails={handleViewDetails}
          onEdit={(c) => crud.openEdit(c as unknown as Client)}
          onDelete={(c) => crud.removeMut.mutateAsync(c.id)}
        />
      </section>

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
        title={crud.editing ? 'Modifier le client' : 'Nouveau client'}
        description={crud.editing ? 'Mettez à jour les informations du client.' : 'Créez un nouveau client.'}
        fields={clientFields}
        initial={crud.editing ? clientToForm(crud.editing) : null}
        onSubmit={handleSubmit}
        onCancel={crud.close}
        submitting={crud.createMut.isPending || crud.updateMut.isPending}
      />
    </main>
  )
}
