import { type Table } from '@tanstack/react-table'
import { Download, Power, RotateCcw, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type DeviceView } from '../data/devices'

export type DeviceBulkAction = 'export' | 'sync' | 'activate' | 'maintenance'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
  canWrite: boolean
  onRun?: (action: DeviceBulkAction, devices: DeviceView[]) => void | Promise<void>
}

export function DataTableBulkActions<TData>({
  table,
  canWrite,
  onRun,
}: DataTableBulkActionsProps<TData>) {
  const selected = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original as DeviceView)

  const run = (action: DeviceBulkAction) => {
    void onRun?.(action, selected)
  }

  return (
    <BulkActionsToolbar table={table} entityName='appareil'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            onClick={() => run('export')}
            className='size-8'
            aria-label='Exporter les appareils sélectionnés'
            title='Exporter les appareils sélectionnés'
          >
            <Download />
            <span className='sr-only'>Exporter les appareils sélectionnés</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Exporter en CSV</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            disabled={!canWrite}
            onClick={() => run('sync')}
            className='size-8'
            aria-label='Forcer la synchronisation'
            title='Forcer la synchronisation'
          >
            <RotateCcw />
            <span className='sr-only'>Forcer la synchronisation</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Forcer la synchronisation (→ SYNCED)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            disabled={!canWrite}
            onClick={() => run('activate')}
            className='size-8'
            aria-label='Activer les appareils sélectionnés'
            title='Activer les appareils sélectionnés'
          >
            <Power />
            <span className='sr-only'>Activer les appareils sélectionnés</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Activer (→ DEPLOYED)</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            disabled={!canWrite}
            onClick={() => run('maintenance')}
            className='size-8'
            aria-label='Passer en maintenance'
            title='Passer en maintenance'
          >
            <Wrench />
            <span className='sr-only'>Passer en maintenance</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Passer en maintenance (→ MAINTENANCE)</p>
        </TooltipContent>
      </Tooltip>
    </BulkActionsToolbar>
  )
}