import { Download, Trash2, Archive } from 'lucide-react'
import { DataTableBulkActions, Button } from '@lpg/ui'
import { toast } from 'sonner'
import type { Table } from '@tanstack/react-table'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export function ModuleBulkActions<TData>({ table, entityName }: { table: Table<TData>; entityName: string }) {
  return (
    <DataTableBulkActions table={table} entityName={entityName}>
      <Button
        variant='ghost'
        size='sm'
        onClick={() => {
          toast.promise(sleep(800), { loading: 'Export...', success: 'Exporté', error: 'Erreur' })
          table.resetRowSelection()
        }}
      >
        <Download /> Exporter
      </Button>
      <Button
        variant='ghost'
        size='sm'
        onClick={() => {
          toast.success('Archivé')
          table.resetRowSelection()
        }}
      >
        <Archive /> Archiver
      </Button>
      <Button
        variant='ghost'
        size='sm'
        onClick={() => {
          toast.success('Supprimé')
          table.resetRowSelection()
        }}
      >
        <Trash2 /> Supprimer
      </Button>
    </DataTableBulkActions>
  )
}
