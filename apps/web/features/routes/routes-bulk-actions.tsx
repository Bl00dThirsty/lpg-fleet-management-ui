import { Download, MapPin, Play } from 'lucide-react'
import { Button, DataTableBulkActions } from '@lpg/ui'
import { toast } from 'sonner'
import type { Table } from '@tanstack/react-table'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export function RoutesBulkActions<TData>({ table }: { table: Table<TData> }) {
  return (
    <DataTableBulkActions table={table} entityName='tournée'>
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
          toast.success('Tournées lancées')
          table.resetRowSelection()
        }}
      >
        <Play /> Lancer
      </Button>
      <Button
        variant='ghost'
        size='sm'
        onClick={() => {
          toast.success('Carte affichée')
          table.resetRowSelection()
        }}
      >
        <MapPin /> Voir sur carte
      </Button>
    </DataTableBulkActions>
  )
}
