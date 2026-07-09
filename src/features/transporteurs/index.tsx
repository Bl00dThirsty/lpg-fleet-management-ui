import { getRouteApi } from '@tanstack/react-router'
import { Truck as TruckIcon } from 'lucide-react'
import { TransporteursTable } from './components/transporteurs-table'
import { transporteurs } from './data/transporteurs'

const route = getRouteApi('/_authenticated/transporteurs/')

export function TransporteursPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const handleViewDetails = (transporteur: { id: string }) => {
    navigate({ to: `/transporteurs/${transporteur.id}` })
  }

  return (
    <main
      id='main-content'
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <div className='flex items-center gap-2 mb-4'>
        <TruckIcon className='h-6 w-6 text-primary' />
        <h1 className='text-2xl font-bold tracking-tight'>Transporteurs</h1>
      </div>

      <section className='rounded-2xl border-transparent bg-background/88 p-3 shadow-sm backdrop-blur-sm sm:p-4'>
        <TransporteursTable
          data={transporteurs}
          search={search}
          navigate={navigate}
          onViewDetails={handleViewDetails}
        />
      </section>
    </main>
  )
}
