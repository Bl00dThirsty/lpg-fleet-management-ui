import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@lpg/ui'
import { PageShell } from '@/components/layout/page'
import { PageHeader } from '@/components/layout/page-header'
import { getTruckById, getTruckTelemetry } from './data/trucks'
import { TruckDetailsBody } from './components/truck-details-sheet'

export function TruckDetailsPage() {
  const { truckId } = useParams({ from: '/_authenticated/trucks/$truckId' })

  const truck = getTruckById(truckId)
  const telemetry = truck ? getTruckTelemetry(truck.id) : null

  return (
    <PageShell fluid>
      <Link to='/trucks' className='inline-flex w-fit'>
        <Button variant='outline' size='sm' className='gap-2'>
          <ArrowLeft className='size-4' />
          Retour a la flotte
        </Button>
      </Link>

      {!truck || !telemetry ? (
        <div className='mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive'>
          <p>Camion introuvable.</p>
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
