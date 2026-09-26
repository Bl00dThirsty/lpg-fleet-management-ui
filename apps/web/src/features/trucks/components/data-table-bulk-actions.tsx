import { useState } from 'react'
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
import { type Truck } from '../data/trucks'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const { t } = useTranslation('common')
  const [pending, setPending] = useState(false)
  const selectedTrucks = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original as Truck)

  const runBulkAction = async (label: string, doneLabel: string) => {
    if (pending) return
    setPending(true)
    try {
      await toast.promise(sleep(900), {
        loading: `${label}...`,
        success: () => {
          table.resetRowSelection()
          return `${doneLabel} (${selectedTrucks.length})`
        },
        error: t('trucks.bulkError'),
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <div aria-busy={pending}>
      <span className='sr-only' aria-live='polite'>
        {pending ? t('trucks.bulkPending') : ''}
      </span>
      <BulkActionsToolbar table={table} entityName={t('trucks.entityName')}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              disabled={pending}
              onClick={() =>
                void runBulkAction(
                  t('trucks.bulkExportLoading'),
                  t('trucks.bulkExportDone')
                )
              }
              className='size-8'
              aria-label={t('trucks.bulkExport')}
              title={t('trucks.bulkExport')}
            >
              <Download />
              <span className='sr-only'>{t('trucks.bulkExport')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('trucks.bulkExport')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              disabled={pending}
              onClick={() =>
                void runBulkAction(
                  t('trucks.bulkMissionLoading'),
                  t('trucks.bulkMissionDone')
                )
              }
              className='size-8'
              aria-label={t('trucks.bulkMission')}
              title={t('trucks.bulkMission')}
            >
              <Route />
              <span className='sr-only'>{t('trucks.bulkMission')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('trucks.bulkMission')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='outline'
              size='icon'
              disabled={pending}
              onClick={() =>
                void runBulkAction(
                  t('trucks.bulkMaintenanceLoading'),
                  t('trucks.bulkMaintenanceDone')
                )
              }
              className='size-8'
              aria-label={t('trucks.bulkMaintenance')}
              title={t('trucks.bulkMaintenance')}
            >
              <Wrench />
              <span className='sr-only'>{t('trucks.bulkMaintenance')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('trucks.bulkMaintenance')}</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>
    </div>
  )
}
