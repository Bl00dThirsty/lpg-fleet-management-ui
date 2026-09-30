import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@lpg/ui'
import { PageShell } from '@/components/layout/page'
import { PageHeader } from '@/components/layout/page-header'
import { getTruckTelemetry, type Truck } from './data/trucks'
import { trucksHooks } from '@/lib/api/use-resources'
import { TruckDetailsBody } from './components/truck-details-sheet'

export function TruckDetailsPage() {
  const { truckId } = useParams({ from: '/_authenticated/trucks/$truckId' })
  const { data, isPending, isError, error } = trucksHooks.useOne(truckId)

  const truck = (data ?? null) as Truck | null
  const telemetry = truck ? getTruckTelemetry(truck.id) : null

  return (
    <PageShell fluid>
      <Link to='/trucks' className='inline-flex w-fit'>
        <Button variant='outline' size='sm' className='gap-2'>
          <ArrowLeft className='size-4' />
          Retour a la flotte
        </Button>
      </Link>

      {isPending ? (
        <p className='mt-6 text-sm text-muted-foreground'>Chargement du camion...</p>
      ) : isError || !truck || !telemetry ? (
        <div className='mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive'>
          <p>Camion introuvable.</p>
          {error ? (
            <p className='mt-1 text-xs opacity-80'>{String(error.message)}</p>
          ) : null}
        </div>
      ) : (
        <section className='mt-4 max-w-3xl space-y-4'>
          <PageHeader
            title={`${truck.type} · ${truck.license_plate}`}
            description={`${truck.id} — ${truck.tenant_name}`}
          />
          <TruckDetailsBody truck={truck} telemetry={telemetry} info={undefined} />
        </section>
      )}
    </PageShell>
  )
}
