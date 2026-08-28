import { getRouteApi } from '@tanstack/react-router'
import { Cpu } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCallback, useState } from 'react'
import { FirmwareTable } from './components/firmware-table'
import { FirmwareDetailsSheet } from './components/firmware-details-sheet'
import { getFirmwareVersions } from './data/firmware'
import type { FirmwareView } from './data/firmware'

const route = getRouteApi('/_authenticated/firmware/')

export function FirmwarePage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [detailsFirmware, setDetailsFirmware] = useState<FirmwareView | null>(null)
  const firmwares = getFirmwareVersions()

  const handleViewDetails = useCallback((firmware: FirmwareView) => {
    setDetailsFirmware(firmware)
  }, [])

  return (
    <main
      id='main-content'
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <section className='rounded-2xl border-transparent bg-background/88 p-3 shadow-sm backdrop-blur-sm sm:p-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <Cpu className='h-6 w-6 text-primary' />
          <h1 className='text-2xl font-bold tracking-tight'>Micrologiciels</h1>
          <Badge variant='outline' className='ml-auto'>
            {firmwares.length}
          </Badge>
        </div>
      </section>

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
        <FirmwareTable
          data={firmwares}
          search={search}
          navigate={navigate}
          onViewDetails={handleViewDetails}
        />
      </section>

      <FirmwareDetailsSheet
        firmware={detailsFirmware}
        open={detailsFirmware !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsFirmware(null)
        }}
      />
    </main>
  )
}