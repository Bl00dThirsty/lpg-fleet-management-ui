import { Download, Mail, CheckCircle } from 'lucide-react'
import { DataTableBulkActions, Button } from '@lpg/ui'
import { toast } from 'sonner'
import type { Table } from '@tanstack/react-table'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export function TransportersBulkActions<TData>({ table }: { table: Table<TData> }) {
  return (
    <DataTableBulkActions table={table} entityName='transporteur'>
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
          toast.success('Contact envoyé')
          table.resetRowSelection()
        }}
      >
        <Mail /> Contacter
      </Button>
      <Button
        variant='ghost'
        size='sm'
        onClick={() => {
          toast.success('Statut mis à jour')
          table.resetRowSelection()
        }}
      >
        <CheckCircle /> Valider
      </Button>
    </DataTableBulkActions>
  )
}
