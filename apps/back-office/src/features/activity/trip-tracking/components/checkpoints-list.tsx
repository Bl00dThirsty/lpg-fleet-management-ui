import { MapPin, Search } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Trip, Checkpoint } from '../data/trip-data'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface CheckpointsListProps {
  trip: Trip
  selectedCheckpointId: string | null
  onSelectCheckpoint: (id: string) => void
}

const statusColors: Record<Checkpoint['status'], string> = {
  pending: 'text-slate-400',
  in_progress: 'text-blue-500',
  completed: 'text-emerald-500',
  failed: 'text-rose-500',
}

const statusLabels: Record<Checkpoint['status'], string> = {
  pending: 'En attente',
  in_progress: 'En cours',
  completed: 'Terminé',
  failed: 'Échoué',
}

function getProgressRingClass(status: Checkpoint['status']) {
  return cn(
    'grid size-3 place-items-center rounded-full p-[0.5px] bg-[conic-gradient(currentColor_0deg_var(--angle),transparent_var(--angle)_360deg)]',
    statusColors[status]
  )
}

function CheckpointCard({ 
  checkpoint, 
  active, 
  onClick 
}: { 
  checkpoint: Checkpoint
  active: boolean
  onClick: () => void 
}) {
  const isCompleted = checkpoint.status === 'completed'
  const angle = isCompleted ? 360 : (checkpoint.status === 'in_progress' ? 180 : 0)

  return (
    <button
      type='button'
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex w-full flex-col gap-3 rounded-xl border p-3 text-left transition-colors',
        'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        active && 'border-primary bg-muted/50'
      )}
    >
      <div className='flex items-center justify-between'>
        <div className='font-medium'>{checkpoint.name}</div>
        <div className='flex items-center gap-1.5'>
          <div
            style={{ '--angle': `${angle}deg` } as React.CSSProperties}
            className={getProgressRingClass(checkpoint.status)}
          >
            <div className='grid size-2 place-items-center rounded-full bg-card'>
              <div className='size-1 rounded-full bg-current' />
            </div>
          </div>
          <div className='text-muted-foreground text-xs font-medium'>
            {statusLabels[checkpoint.status]}
          </div>
        </div>
      </div>

      <div className='flex items-start gap-2'>
        <MapPin className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
        <span className='text-sm text-muted-foreground line-clamp-2'>{checkpoint.address}</span>
      </div>

      <div className='flex items-center justify-between pt-1 border-t border-border/50'>
        <div className='flex flex-col gap-0.5'>
          <span className='text-xs text-muted-foreground'>Prévu</span>
          <span className='text-sm font-medium tabular-nums'>{checkpoint.scheduledTime}</span>
        </div>
        {checkpoint.actualTime && (
          <div className='flex flex-col gap-0.5 text-right'>
            <span className='text-xs text-muted-foreground'>Réel</span>
            <span className='text-sm font-medium tabular-nums'>{checkpoint.actualTime}</span>
          </div>
        )}
      </div>
    </button>
  )
}

export function CheckpointsList({ trip, selectedCheckpointId, onSelectCheckpoint }: CheckpointsListProps) {
  return (
    <div className='flex h-full flex-col'>
      <div className='flex shrink-0 items-center justify-between px-4 py-3 border-b bg-background'>
        <h2 className='text-sm font-semibold tracking-tight'>Points de livraison</h2>
        <Badge variant='secondary'>{trip.checkpoints?.length || 0}</Badge>
      </div>
      <div className='px-4 py-3 relative border-b bg-background'>
        <Search className='absolute left-6 top-5 h-4 w-4 text-muted-foreground' />
        <Input placeholder='Rechercher...' className='pl-9 h-9' />
      </div>

      <ScrollArea className='flex-1 p-4 bg-muted/10'>
        <div className='flex flex-col gap-3'>
          {trip.checkpoints?.map((checkpoint) => (
            <CheckpointCard
              key={checkpoint.id}
              checkpoint={checkpoint}
              active={selectedCheckpointId === checkpoint.id}
              onClick={() => onSelectCheckpoint(checkpoint.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
