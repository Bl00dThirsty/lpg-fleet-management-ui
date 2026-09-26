import { type Table } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { Download, Route, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { sleep } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type VehicleView } from '../data/vehicles'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const { t } = useTranslation('common')
  const selected = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original as VehicleView)

  const runBulkAction = (label: string, doneLabel: string) => {
    toast.promise(sleep(900), {
      loading: `${label}...`,
      success: () => {
        table.resetRowSelection()
        return `${doneLabel} (${selected.length})`
      },
      error: 'Action impossible',
    })
  }

  return (
    <BulkActionsToolbar table={table} entityName='vehicule'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            onClick={() => runBulkAction('Preparation export', 'Export pret')}
            className='size-8'
            aria-label={t('action.exportVehiclesSelected')}
            title={t('action.exportVehiclesSelected')}
          >
            <Download />
            <span className='sr-only'>{t('action.exportVehiclesSelected')}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('action.exportVehiclesSelected')}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            onClick={() =>
              runBulkAction('Affectation mission', 'Mission affectee')
            }
            className='size-8'
            aria-label='Affecter une mission'
            title='Affecter une mission'
          >
            <Route />
            <span className='sr-only'>Affecter une mission</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Affecter une mission</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            onClick={() =>
              runBulkAction(
                'Planification maintenance',
                'Maintenance planifiee'
              )
            }
            className='size-8'
            aria-label='Planifier la maintenance'
            title='Planifier la maintenance'
          >
            <Wrench />
            <span className='sr-only'>Planifier la maintenance</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Planifier la maintenance</p>
        </TooltipContent>
      </Tooltip>
    </BulkActionsToolbar>
  )
}