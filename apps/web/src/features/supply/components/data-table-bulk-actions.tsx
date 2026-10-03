import { type Table } from '@tanstack/react-table'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { sleep } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type SupplyRequest } from '../data/supply'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const selected = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original as SupplyRequest)

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
    <BulkActionsToolbar table={table} entityName='demande'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            onClick={() => runBulkAction('Preparation export', 'Export pret')}
            className='size-8'
            aria-label='Exporter les demandes selectionnees'
            title='Exporter les demandes selectionnees'
          >
            <Download />
            <span className='sr-only'>Exporter les demandes selectionnees</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Exporter les demandes selectionnees</p>
        </TooltipContent>
      </Tooltip>
    </BulkActionsToolbar>
  )
}
