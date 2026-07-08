import { getRouteApi } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { MarketersTable } from './components/marketers-table'
import { marketers } from './data/marketers'

const route = getRouteApi('/_authenticated/marketers/')

export function MarketersPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const handleViewDetails = (marketer: { id: string }) => {
    navigate({ to: `/marketers/${marketer.id}` })
  }

  return (
    <main
      id='main-content'
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <div className='flex items-center gap-2 mb-4'>
        <Building2 className='h-6 w-6 text-primary' />
        <h1 className='text-2xl font-bold tracking-tight'>Marketers</h1>
      </div>
      
      <section className='rounded-2xl border-transparent bg-background/88 p-3 shadow-sm backdrop-blur-sm sm:p-4'>
        <MarketersTable
          data={marketers}
          search={search}
          navigate={navigate}
          onViewDetails={handleViewDetails}
        />
      </section>
    </main>
  )
}
