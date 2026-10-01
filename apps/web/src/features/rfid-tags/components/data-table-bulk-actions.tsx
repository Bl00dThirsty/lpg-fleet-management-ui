import { type Table } from '@tanstack/react-table'
import { Download, Scan, Ban } from 'lucide-react'
import { toast } from 'sonner'
import { sleep } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type RfidTagView } from '../data/rfid-tags'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const selected = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original as RfidTagView)

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
    <BulkActionsToolbar table={table} entityName='tag RFID'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            onClick={() => runBulkAction('Preparation export', 'Export pret')}
            className='size-8'
            aria-label='Exporter les tags RFID selectionnes'
            title='Exporter les tags RFID selectionnes'
          >
            <Download />
            <span className='sr-only'>Exporter les tags RFID selectionnes</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Exporter les tags RFID selectionnes</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            onClick={() =>
              runBulkAction('Reconciliation scan', 'Scan lance')
            }
            className='size-8'
            aria-label='Lancer un scan de reconciliation'
            title='Lancer un scan de reconciliation'
          >
            <Scan />
            <span className='sr-only'>Lancer un scan de reconciliation</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Lancer un scan de reconciliation</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            onClick={() =>
              runBulkAction('Blocage des tags', 'Tags bloques')
            }
            className='size-8'
            aria-label='Bloquer les tags'
            title='Bloquer les tags'
          >
            <Ban />
            <span className='sr-only'>Bloquer les tags</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Bloquer les tags</p>
        </TooltipContent>
      </Tooltip>
    </BulkActionsToolbar>
  )
}