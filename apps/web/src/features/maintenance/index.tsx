import { getRouteApi } from '@tanstack/react-router'
import { Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCallback, useState } from 'react'
import { MaintenanceTable } from './components/maintenance-table'
import { MaintenanceDetailsSheet } from './components/maintenance-details-sheet'
import { getMaintenanceItems } from './data/maintenance'
import type { MaintenanceView } from './data/maintenance'

const route = getRouteApi('/_authenticated/maintenance/')

export function MaintenancePage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [detailsItem, setDetailsItem] = useState<MaintenanceView | null>(null)
  const items = getMaintenanceItems()

  const handleViewDetails = useCallback((item: MaintenanceView) => {
    setDetailsItem(item)
  }, [])

  return (
    <main
      id='main-content'
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <section className='rounded-2xl border-transparent bg-background/88 p-3 shadow-sm backdrop-blur-sm sm:p-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <Wrench className='h-6 w-6 text-primary' />
          <h1 className='text-2xl font-bold tracking-tight'>Maintenance</h1>
          <Badge variant='outline' className='ml-auto'>
            {items.length}
          </Badge>
        </div>
      </section>

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
        <MaintenanceTable
          data={items}
          search={search}
          navigate={navigate}
          onViewDetails={handleViewDetails}
        />
      </section>

      <MaintenanceDetailsSheet
        item={detailsItem}
        open={detailsItem !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsItem(null)
        }}
      />
    </main>
  )
}