import { getRouteApi } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { Truck as TruckIcon } from 'lucide-react'
import { TransportersTable } from './transporters-table'
import { transportersHooks } from '@/lib/api/use-resources'
import { type Transporter } from './transporters'
import { PageHeader } from '@/components/layout/page-header'
import { PageShell, SectionCard } from '@/components/layout/page'

const route = getRouteApi('/_authenticated/transporters/')

export function TransportersPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const { data, isPending, isError, error, refetch } =
    transportersHooks.useList({ page: 1, limite: 50 })

  const handleViewDetails = (transporter: { id: string }) => {
    navigate({ to: `/transporters/${transporter.id}` })
  }

  return (
    <PageShell>
      <PageHeader
        title='Transporters'
        icon={TruckIcon}
        description='Partenaires de transport et leur flotte.'
      />

      {isPending ? (
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Loader2 className='h-4 w-4 animate-spin' /> Chargement…
        </div>
      ) : isError ? (
        <div className='flex flex-col items-start gap-2 rounded-xl border border-destructive/40 p-4'>
          <p className='text-sm text-destructive'>
            {(error as Error)?.message ?? 'Erreur de chargement'}
          </p>
          <button
            type='button'
            onClick={() => refetch()}
            className='mt-2 rounded-md border border-destructive/40 px-2 py-1 text-xs hover:bg-destructive/10'
          >
            Reessayer
          </button>
        </div>
      ) : (
        <SectionCard>
          <TransportersTable
            data={(data?.data ?? []) as Transporter[]}
            search={search}
            navigate={navigate}
            onViewDetails={handleViewDetails}
          />
        </SectionCard>
      )}
    </PageShell>
  )
}

