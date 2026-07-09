import { AlertTriangleIcon, Copy, Truck, Star, Phone, PackageOpen, Info } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

import type { Trip } from '../data/trip-data'
import { TripRouteMap } from './trip-route-map'

const progressRingClasses: Record<Trip['status'], string> = {
  Planifié: 'text-slate-400',
  'En transit': 'text-blue-500',
  'En livraison': 'text-amber-500',
  Livré: 'text-emerald-500',
  Retardé: 'text-rose-500',
}

const statusBadgeClasses: Record<Trip['status'], string> = {
  Planifié: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400',
  'En transit': 'border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-400',
  'En livraison': 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400',
  Livré: 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400',
  Retardé: 'border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400',
}

type TripDetailsProps = {
  trip: Trip | null
}

function EmptyTripOverview() {
  return (
    <div className='grid min-h-[12rem] place-items-center rounded-lg border border-dashed text-muted-foreground text-sm'>
      Sélectionnez une tournée pour voir les détails.
    </div>
  )
}

function TripOverview({ trip }: { trip: Trip }) {
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
        <div className='flex items-center gap-2'>
          <h1 className='font-medium text-lg tabular-nums tracking-tight sm:text-xl'>{trip.id}</h1>
          <Button variant='ghost' size='icon' className='h-8 w-8' aria-label='Copier ID'>
            <Copy className='h-4 w-4' />
          </Button>
        </div>

        <div className='flex items-center gap-2 text-xs sm:text-sm'>
          <Badge variant='outline' className={cn('gap-1.5', statusBadgeClasses[trip.status])}>
            <span className={cn('size-1.5 rounded-full bg-current', progressRingClasses[trip.status])} />
            {trip.status}
          </Badge>
          <span className='text-muted-foreground'>·</span>
          <span className='text-foreground tabular-nums'>{trip.progress}% complété</span>
          <span className='text-muted-foreground'>·</span>
          <span className='text-foreground tabular-nums'>
            ETA: {trip.eta} {trip.etaMeta && <span className='text-muted-foreground'>({trip.etaMeta})</span>}
          </span>
        </div>
      </div>

      <Separator />

      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Avatar className='h-10 w-10'>
            <AvatarFallback className='rounded-md bg-primary/10 text-primary font-bold'>
              {trip.marketer.initials}
            </AvatarFallback>
          </Avatar>

          <div className='flex flex-col'>
            <div className='font-medium text-sm'>{trip.marketer.name}</div>
            <div className='text-muted-foreground text-xs'>Marketer</div>
          </div>
        </div>

        <div className='flex flex-col items-end gap-1'>
          <Badge variant='secondary' className='gap-1'>
            <Star className='h-3 w-3 fill-amber-400 text-amber-400' />
            {trip.marketer.tier}
          </Badge>
        </div>
      </div>

      <Separator />

      <div className='flex flex-col gap-6'>
        <div className='flex items-start justify-between gap-4'>
          <h2 className='font-medium'>Détails du transport</h2>
          <Button variant='outline' size='sm' className='gap-2'>
            <Phone className='h-4 w-4' />
            Appeler Chauffeur
          </Button>
        </div>

        <div className='grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-4'>
          <div className='flex flex-col gap-1.5'>
            <div className='text-muted-foreground text-xs'>Marchandise</div>
            <div className='text-sm font-medium flex items-center gap-2'>
              <PackageOpen className='h-4 w-4 text-muted-foreground' />
              {trip.cargo}
            </div>
          </div>

          <div className='flex flex-col gap-1.5'>
            <div className='text-muted-foreground text-xs'>Volume / Quantité</div>
            <div className='text-sm font-medium'>{trip.volume}</div>
          </div>

          <div className='flex flex-col gap-1.5'>
            <div className='text-muted-foreground text-xs'>Camion assigné</div>
            <div className='text-sm font-medium flex items-center gap-2'>
              <Truck className='h-4 w-4 text-muted-foreground' />
              {trip.truckPlate}
            </div>
          </div>

          <div className='flex flex-col gap-1.5 md:text-right'>
            <div className='text-muted-foreground text-xs'>Chauffeur</div>
            <div className='text-sm font-medium'>{trip.driver}</div>
          </div>
        </div>
      </div>

      <Separator />

      <Alert className={cn(
        'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-200',
        trip.handling.tags.some(t => t.type === 'info') && 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-200'
      )}>
        {trip.handling.tags.some(t => t.type === 'info') ? (
          <Info className='h-4 w-4' />
        ) : (
          <AlertTriangleIcon className='h-4 w-4' />
        )}
        <AlertTitle className='font-semibold'>{trip.handling.label}</AlertTitle>
        <AlertDescription className='mt-2 space-y-3'>
          <div className='text-sm'>
            {trip.handling.note}
          </div>
          
          <div className='flex flex-wrap gap-2'>
            {trip.handling.tags.map((tag) => (
              <Badge
                key={tag.label}
                variant='outline'
                className={cn(
                  'rounded-sm bg-background/50',
                  tag.type === 'info' ? 'border-blue-200 text-blue-800 dark:border-blue-800 dark:text-blue-300' : 'border-amber-200 text-amber-800 dark:border-amber-800 dark:text-amber-300'
                )}
              >
                {tag.label}
              </Badge>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

export function TripDetails({ trip }: TripDetailsProps) {
  if (!trip) {
    return (
      <div className='grid h-full min-h-0 grid-rows-[320px_1fr] overflow-hidden lg:grid-rows-[420px_1fr]'>
        <div className='min-h-0 overflow-hidden border-b'>
          <TripRouteMap trip={null} />
        </div>
        <div className='min-h-0 overflow-auto p-4 sm:p-6'>
          <EmptyTripOverview />
        </div>
      </div>
    )
  }

  return (
    <div className='grid h-full min-h-0 grid-rows-[320px_1fr] overflow-hidden lg:grid-rows-[420px_1fr]'>
      <div className='min-h-0 overflow-hidden border-b'>
        <TripRouteMap trip={trip} />
      </div>
      <div className='min-h-0 overflow-hidden'>
        <div className='h-full min-h-0'>
          <Tabs defaultValue='overview' className='flex h-full flex-col'>
            <TabsList
              className='w-full justify-start gap-4 rounded-none border-b bg-transparent px-4 py-0 sm:px-6'
            >
              <TabsTrigger
                value='overview'
                className='rounded-none border-x-0 border-t-0 border-b-2 border-transparent px-2 py-3 data-[state=active]:border-primary data-[state=active]:!bg-transparent data-[state=active]:!shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground'
              >
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger
                value='documents'
                className='rounded-none border-x-0 border-t-0 border-b-2 border-transparent px-2 py-3 data-[state=active]:border-primary data-[state=active]:!bg-transparent data-[state=active]:!shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground'
              >
                Documents & BL
              </TabsTrigger>
              <TabsTrigger
                value='activity'
                className='rounded-none border-x-0 border-t-0 border-b-2 border-transparent px-2 py-3 data-[state=active]:border-primary data-[state=active]:!bg-transparent data-[state=active]:!shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground'
              >
                Journal d'activité
              </TabsTrigger>
            </TabsList>
            
            <ScrollArea className='flex-1'>
              <TabsContent value='overview' className='m-0 p-4 sm:p-6'>
                <TripOverview trip={trip} />
              </TabsContent>
              <TabsContent value='documents' className='m-0 p-4 sm:p-6'>
                <div className='grid min-h-[12rem] place-items-center rounded-lg border border-dashed text-muted-foreground text-sm'>
                  Gestion des Bons de Livraison et documents à venir.
                </div>
              </TabsContent>
              <TabsContent value='activity' className='m-0 p-4 sm:p-6'>
                <div className='grid min-h-[12rem] place-items-center rounded-lg border border-dashed text-muted-foreground text-sm'>
                  Historique des événements du trajet à venir.
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
