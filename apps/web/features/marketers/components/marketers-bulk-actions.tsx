import { Download, Mail, UserCheck } from 'lucide-react'
import { Button, DataTableBulkActions } from '@lpg/ui'
import { toast } from 'sonner'
import type { Table } from '@tanstack/react-table'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export function MarketersBulkActions<TData>({ table }: { table: Table<TData> }) {
  return (
    <DataTableBulkActions table={table} entityName='marketeur'>
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
          toast.success('Statut mis à jour')
          table.resetRowSelection()
        }}
      >
        <UserCheck /> Activer
      </Button>
      <Button
        variant='ghost'
        size='sm'
        onClick={() => {
          toast.success('Email envoyé')
          table.resetRowSelection()
        }}
      >
        <Mail /> Contacter
      </Button>
    </DataTableBulkActions>
  )
}
