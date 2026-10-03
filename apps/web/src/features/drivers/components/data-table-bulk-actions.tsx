import { type Table } from '@tanstack/react-table'
import { Download, Power, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { sleep } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type DriverView } from '../data/drivers'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const selected = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original as DriverView)

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
    <BulkActionsToolbar table={table} entityName='chauffeur'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            onClick={() => runBulkAction('Preparation export', 'Export pret')}
            className='size-8'
            aria-label='Exporter les chauffeurs selectionnes'
            title='Exporter les chauffeurs selectionnes'
          >
            <Download />
            <span className='sr-only'>Exporter les chauffeurs selectionnes</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Exporter les chauffeurs selectionnes</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            onClick={() =>
              runBulkAction('Affectation chauffeur', 'Affectation effectuee')
            }
            className='size-8'
            aria-label='Affecter un vehicule'
            title='Affecter un vehicule'
          >
            <UserCheck />
            <span className='sr-only'>Affecter un vehicule</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Affecter un vehicule</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            onClick={() =>
              runBulkAction('Changement de statut', 'Statut modifie')
            }
            className='size-8'
            aria-label='Activer ou desactiver'
            title='Activer ou desactiver'
          >
            <Power />
            <span className='sr-only'>Activer ou desactiver</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Activer ou desactiver</p>
        </TooltipContent>
      </Tooltip>
    </BulkActionsToolbar>
  )
}