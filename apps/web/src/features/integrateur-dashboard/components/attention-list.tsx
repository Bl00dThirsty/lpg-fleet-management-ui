import { WifiOff } from 'lucide-react'
import { Badge } from '@lpg/ui'
import type { DeviceAttention } from '@lpg/mock-data'

export function AttentionList({ rows }: { rows: DeviceAttention[] }) {
  if (rows.length === 0) {
    return (
      <p className='py-6 text-center text-sm text-muted-foreground'>
        Aucun appareil hors ligne — le parc est entièrement opérationnel.
      </p>
    )
  }

  return (
    <div className='space-y-2'>
      {rows.map((row) => (
        <div key={row.id} className='flex items-center gap-3 rounded-lg border p-3'>
          <span className='flex size-8 shrink-0 items-center justify-center rounded-md bg-rose-50 dark:bg-rose-950'>
            <WifiOff className='size-4 text-rose-600' />
          </span>
          <div className='min-w-0'>
            <p className='truncate text-sm font-medium'>{row.serial}</p>
            <p className='truncate text-xs text-muted-foreground'>
              {row.type} · dernier sync {row.lastSync ? new Date(row.lastSync).toLocaleString('fr-FR') : '—'}
            </p>
          </div>
          <Badge variant='destructive' className='ml-auto shrink-0'>
            OFFLINE
          </Badge>
        </div>
      ))}
    </div>
  )
}
