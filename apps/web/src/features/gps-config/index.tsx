import { getRouteApi } from '@tanstack/react-router'
import { Satellite } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCallback, useState } from 'react'
import { GpsConfigTable } from './components/gps-config-table'
import { GpsConfigDetailsSheet } from './components/gps-config-details-sheet'
import { getGpsConfigs } from './data/gps-config'
import type { GpsConfigView } from './data/gps-config'

const route = getRouteApi('/_authenticated/gps-config/')

export function GpsConfigPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [detailsConfig, setDetailsConfig] = useState<GpsConfigView | null>(null)
  const configs = getGpsConfigs()

  const handleViewDetails = useCallback((config: GpsConfigView) => {
    setDetailsConfig(config)
  }, [])

  return (
    <main
      id='main-content'
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <section className='rounded-2xl border-transparent bg-background/88 p-3 shadow-sm backdrop-blur-sm sm:p-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <Satellite className='h-6 w-6 text-primary' />
          <h1 className='text-2xl font-bold tracking-tight'>Config GPS</h1>
          <Badge variant='outline' className='ml-auto'>
            {configs.length}
          </Badge>
        </div>
      </section>

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
        <GpsConfigTable
          data={configs}
          search={search}
          navigate={navigate}
          onViewDetails={handleViewDetails}
        />
      </section>

      <GpsConfigDetailsSheet
        config={detailsConfig}
        open={detailsConfig !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsConfig(null)
        }}
      />
    </main>
  )
}