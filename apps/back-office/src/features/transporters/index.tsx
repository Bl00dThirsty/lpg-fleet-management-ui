import { getRouteApi } from '@tanstack/react-router'
import { Truck as TruckIcon } from 'lucide-react'
import { TransportersTable } from './components/transporters-table'
import { transporters } from './data/transporters'

const route = getRouteApi('/_authenticated/transporters/')

export function TransportersPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const handleViewDetails = (transporter: { id: string }) => {
    navigate({ to: `/transporters/${transporter.id}` })
  }

  return (
    <main
      id='main-content'
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <div className='flex items-center gap-2 mb-4'>
        <TruckIcon className='h-6 w-6 text-primary' />
        <h1 className='text-2xl font-bold tracking-tight'>Transporters</h1>
      </div>

      <section className='rounded-2xl border-transparent bg-background/88 p-3 shadow-sm backdrop-blur-sm sm:p-4'>
        <TransportersTable
          data={transporters}
          search={search}
          navigate={navigate}
          onViewDetails={handleViewDetails}
        />
      </section>
    </main>
  )
}
