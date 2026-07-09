import { Truck, MapPin, Navigation } from 'lucide-react'
import type { Tournee } from '../data/tournee-data'

type TourneeRouteMapProps = {
  tournee: Tournee | null
}

export function TourneeRouteMap({ tournee }: TourneeRouteMapProps) {
  if (!tournee) {
    return (
      <div className='flex h-full w-full items-center justify-center bg-muted/30'>
        <div className='flex flex-col items-center text-muted-foreground'>
          <Navigation className='mb-2 h-8 w-8 opacity-20' />
          <p className='text-sm'>Sélectionnez une tournée pour voir la carte</p>
        </div>
      </div>
    )
  }

  return (
    <div className='relative h-full w-full overflow-hidden bg-slate-100 dark:bg-slate-900'>
      {/* Decorative background representing a simplified map/grid */}
      <div
        className='absolute inset-0'
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.3
        }}
      />
      
      <div className='absolute inset-0 flex flex-col items-center justify-center p-8'>
        {/* Simple visual representation of the route */}
        <div className='flex w-full max-w-md items-center justify-between relative'>
          
          {/* Line connecting origin and destination */}
          <div className='absolute left-8 right-8 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800'>
            <div 
              className='h-full bg-primary transition-all duration-1000'
              style={{ width: `${tournee.progress}%` }}
            />
          </div>

          {/* Origin */}
          <div className='relative z-10 flex flex-col items-center gap-2'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-slate-800 text-white shadow-md dark:border-slate-950'>
              <MapPin className='h-5 w-5' />
            </div>
            <div className='text-center'>
              <p className='font-bold text-slate-900 dark:text-slate-100'>{tournee.origin.city}</p>
              <p className='text-xs text-slate-500'>{tournee.origin.name}</p>
            </div>
          </div>

          {/* Truck (moving) */}
          <div 
            className='absolute top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000'
            style={{ left: `calc(2rem + ${tournee.progress}% * 0.7)` }} // Approximate positioning
          >
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-white dark:ring-slate-950'>
              <Truck className='h-5 w-5' />
            </div>
          </div>

          {/* Destination */}
          <div className='relative z-10 flex flex-col items-center gap-2'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-slate-300 text-slate-700 shadow-md dark:border-slate-950 dark:bg-slate-700 dark:text-slate-300'>
              <MapPin className='h-5 w-5' />
            </div>
            <div className='text-center'>
              <p className='font-bold text-slate-900 dark:text-slate-100'>{tournee.destination.city}</p>
              <p className='text-xs text-slate-500'>{tournee.destination.name}</p>
            </div>
          </div>

        </div>

        <div className='mt-12 rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm dark:bg-slate-950/80 dark:text-slate-400'>
          Carte interactive complète à venir
        </div>
      </div>
    </div>
  )
}
