import { Search, SlidersHorizontal, Truck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

import type { Tournee } from '../data/tournee-data'

const progressRingClasses: Record<Tournee['status'], string> = {
  Planifié: 'text-slate-400',
  'En transit': 'text-blue-500',
  'En livraison': 'text-amber-500',
  Livré: 'text-emerald-500',
  Retardé: 'text-rose-500',
}

function getProgressRingClass(status: Tournee['status']) {
  return cn(
    'grid size-3 place-items-center rounded-full p-[0.5px] bg-[conic-gradient(currentColor_0deg_var(--angle),transparent_var(--angle)_360deg)]',
    progressRingClasses[status]
  )
}

type TourneeCardProps = {
  active?: boolean
  onSelectTournee: (id: Tournee['id']) => void
  tournee: Tournee
}

type TourneeListProps = {
  onSelectTournee: (id: Tournee['id']) => void
  selectedTourneeId: Tournee['id'] | null
  tournees: Tournee[]
}

function TourneeCard({ tournee, active, onSelectTournee }: TourneeCardProps) {
  const angle = (tournee.progress / 100) * 360

  return (
    <button
      type='button'
      aria-pressed={active}
      onClick={(event) => {
        event.currentTarget.blur()
        onSelectTournee(tournee.id)
      }}
      className={cn(
        'flex w-full flex-col gap-5 rounded-xl border p-3 text-left transition-colors',
        'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        active && 'border-primary bg-muted/50'
      )}
    >
      <div className='flex items-center justify-between'>
        <div className='font-medium'>{tournee.id}</div>

        <div className='flex items-center gap-1'>
          <div
            style={{ '--angle': `${angle}deg` } as React.CSSProperties}
            className={getProgressRingClass(tournee.status)}
          >
            <div className='grid size-2 place-items-center rounded-full bg-card'>
              <div className='size-1 rounded-full bg-current' />
            </div>
          </div>
          <div className='text-muted-foreground text-xs font-medium'>{tournee.status}</div>
        </div>
      </div>

      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-1.5'>
          <div className='flex flex-col gap-0.5'>
            <div className='font-medium text-xs leading-none'>{tournee.origin.city},</div>
            <div className='text-muted-foreground text-xs'>{tournee.origin.name}</div>
          </div>
        </div>

        <div className='flex items-center gap-1.5 text-right'>
          <div className='flex flex-col gap-0.5 text-right'>
            <div className='font-medium text-xs leading-none'>{tournee.destination.city},</div>
            <div className='text-muted-foreground text-xs'>{tournee.destination.name}</div>
          </div>
        </div>
      </div>

      <div className='flex items-center gap-0.5'>
        <span
          className='h-px min-w-0 border-foreground border-t border-dashed'
          style={{ flexGrow: tournee.progress, flexBasis: 0 }}
        />
        <Truck className='size-4 text-primary' />
        <span
          className='h-px min-w-0 border-border border-t border-dashed'
          style={{ flexGrow: 100 - tournee.progress, flexBasis: 0 }}
        />
      </div>

      <div className='flex items-center justify-between'>
        <div>
          <div className='text-muted-foreground text-xs leading-none'>Chargement</div>
          <div className='truncate text-sm tracking-tight font-medium'>{tournee.cargo} - {tournee.volume}</div>
        </div>
        <div className='text-right'>
          <div className='text-muted-foreground text-xs leading-none'>Arrivée estimée</div>
          <div className='text-sm tabular-nums tracking-tight font-medium'>
            {tournee.eta}
            {tournee.etaMeta && (
              <span className='ml-1 font-normal text-muted-foreground text-xs'>{tournee.etaMeta}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}

export function TourneeList({ tournees, selectedTourneeId, onSelectTournee }: TourneeListProps) {
  return (
    <Card className='h-full rounded-none ring-0 border-y-0 border-l-0 shadow-none'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='font-semibold text-lg'>Tournées actives</CardTitle>
          <Button size='icon' variant='ghost' className='h-8 w-8'>
            <SlidersHorizontal className='h-4 w-4' />
          </Button>
        </div>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-4 overflow-hidden px-0 h-[calc(100vh-140px)]'>
        <Tabs defaultValue='all' className='px-4'>
          <TabsList className='w-full'>
            <TabsTrigger className='flex-1 text-xs' value='all'>Toutes (24)</TabsTrigger>
            <TabsTrigger className='flex-1 text-xs' value='in-transit'>En transit (12)</TabsTrigger>
            <TabsTrigger className='flex-1 text-xs' value='delivered'>Livrées (10)</TabsTrigger>
            <TabsTrigger className='flex-1 text-xs' value='delayed'>Retards (2)</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className='px-4 relative'>
          <Search className='absolute left-6 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input placeholder='Rechercher une tournée, camion, ou client...' className='pl-9' />
        </div>

        <ScrollArea className='flex-1'>
          <div className='flex flex-col gap-3 px-4 pb-4'>
            {tournees.map((tournee) => (
              <TourneeCard
                active={tournee.id === selectedTourneeId}
                key={tournee.id}
                tournee={tournee}
                onSelectTournee={onSelectTournee}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
