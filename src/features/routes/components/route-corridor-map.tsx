import { type ElementType, useMemo } from 'react'
import { Clock3, MapPinned, Route as RouteIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { type RouteTripView } from '../data/routes'

type RouteCorridorMapProps = {
  trip: RouteTripView
  formatDateTime: (value: string) => string
}

type CanvasPoint = {
  x: number
  y: number
}

const canvasHeight = 320
const canvasWidth = 620
const canvasPadding = 32

export function RouteCorridorMap({
  trip,
  formatDateTime,
}: RouteCorridorMapProps) {
  const canvas = useMemo(() => {
    const coordinates = [
      {
        latitude: trip.originSite.latitude,
        longitude: trip.originSite.longitude,
      },
      ...trip.telemetry,
      {
        latitude: trip.destinationSite.latitude,
        longitude: trip.destinationSite.longitude,
      },
    ]
    const latitudes = coordinates.map((point) => point.latitude)
    const longitudes = coordinates.map((point) => point.longitude)
    const minLatitude = Math.min(...latitudes)
    const maxLatitude = Math.max(...latitudes)
    const minLongitude = Math.min(...longitudes)
    const maxLongitude = Math.max(...longitudes)
    const longitudeSpan = Math.max(maxLongitude - minLongitude, 0.01)
    const latitudeSpan = Math.max(maxLatitude - minLatitude, 0.01)

    const toCanvasPoint = (
      latitude: number,
      longitude: number
    ): CanvasPoint => {
      const x =
        canvasPadding +
        ((longitude - minLongitude) / longitudeSpan) *
          (canvasWidth - canvasPadding * 2)
      const y =
        canvasHeight -
        canvasPadding -
        ((latitude - minLatitude) / latitudeSpan) *
          (canvasHeight - canvasPadding * 2)

      return { x, y }
    }

    const routePoints = coordinates.map((point) =>
      toCanvasPoint(point.latitude, point.longitude)
    )
    const stopPoints = trip.stops.map((stop) => ({
      ...stop,
      point: toCanvasPoint(stop.site.latitude, stop.site.longitude),
    }))
    const currentPoint = toCanvasPoint(
      trip.latestTelemetry.latitude,
      trip.latestTelemetry.longitude
    )

    return {
      routePoints,
      stopPoints,
      currentPoint,
      polyline: routePoints.map((point) => `${point.x},${point.y}`).join(' '),
    }
  }, [trip])

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='border-b bg-muted/20'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <CardTitle>Carte de tournee</CardTitle>
            <CardDescription>
              Tracé GPS entre sites logistiques et point de livraison.
            </CardDescription>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Badge variant='outline' className='gap-1'>
              <RouteIcon className='size-3.5' />
              {trip.routeDistanceKm} km
            </Badge>
            <Badge variant='outline' className='gap-1'>
              <Clock3 className='size-3.5' />
              {formatDateTime(trip.lastUpdatedAt)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4 p-4'>
        <div className='relative overflow-hidden rounded-2xl border bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_38%),linear-gradient(180deg,rgba(15,23,42,0.97),rgba(15,23,42,0.9))] px-2 py-2'>
          <svg
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            className='h-[320px] w-full'
            role='img'
            aria-label={`Trace de la tournee ${trip.reference}`}
          >
            <defs>
              <linearGradient
                id='route-corridor-line'
                x1='0%'
                x2='100%'
                y1='0%'
                y2='0%'
              >
                <stop offset='0%' stopColor='#22c55e' />
                <stop offset='50%' stopColor='#38bdf8' />
                <stop offset='100%' stopColor='#f59e0b' />
              </linearGradient>
            </defs>

            {Array.from({ length: 5 }).map((_, index) => {
              const y = canvasPadding + index * 56

              return (
                <line
                  key={`grid-y-${index}`}
                  x1={canvasPadding}
                  x2={canvasWidth - canvasPadding}
                  y1={y}
                  y2={y}
                  stroke='rgba(148, 163, 184, 0.14)'
                  strokeDasharray='6 8'
                />
              )
            })}

            {Array.from({ length: 7 }).map((_, index) => {
              const x = canvasPadding + index * 84

              return (
                <line
                  key={`grid-x-${index}`}
                  x1={x}
                  x2={x}
                  y1={canvasPadding}
                  y2={canvasHeight - canvasPadding}
                  stroke='rgba(148, 163, 184, 0.08)'
                />
              )
            })}

            <polyline
              fill='none'
              points={canvas.polyline}
              stroke='url(#route-corridor-line)'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='5'
            />

            {canvas.routePoints.map((point, index) => (
              <circle
                key={`point-${index}`}
                cx={point.x}
                cy={point.y}
                fill='rgba(226, 232, 240, 0.7)'
                r='4'
              />
            ))}

            {canvas.stopPoints.map((stop) => (
              <g key={stop.id}>
                <circle
                  cx={stop.point.x}
                  cy={stop.point.y}
                  fill={
                    stop.completed
                      ? 'rgba(34, 197, 94, 0.95)'
                      : 'rgba(248, 250, 252, 0.95)'
                  }
                  r='10'
                  stroke={
                    stop.role === 'delivery'
                      ? '#f59e0b'
                      : stop.role === 'checkpoint'
                        ? '#38bdf8'
                        : '#22c55e'
                  }
                  strokeWidth='3'
                />
                <text
                  fill='rgba(248, 250, 252, 0.9)'
                  fontSize='11'
                  textAnchor='middle'
                  x={stop.point.x}
                  y={stop.point.y - 16}
                >
                  {stop.site.city}
                </text>
              </g>
            ))}

            <circle
              cx={canvas.currentPoint.x}
              cy={canvas.currentPoint.y}
              fill='rgba(56, 189, 248, 0.22)'
              r='18'
            />
            <circle
              cx={canvas.currentPoint.x}
              cy={canvas.currentPoint.y}
              fill='#38bdf8'
              r='7'
              stroke='white'
              strokeWidth='3'
            />
          </svg>

          <div className='pointer-events-none absolute inset-x-4 top-4 flex flex-wrap justify-between gap-2'>
            <div className='rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/90 backdrop-blur'>
              {trip.originSite.city}
            </div>
            <div className='rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/90 backdrop-blur'>
              {trip.destinationSite.city}
            </div>
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-3'>
          <SignalTile
            label='Position courante'
            value={trip.truck.currentLocation}
            icon={MapPinned}
          />
          <SignalTile
            label='Sites traverses'
            value={`${trip.stops.length} etapes`}
            icon={RouteIcon}
          />
          <SignalTile
            label='Derniere maj'
            value={formatDateTime(trip.latestTelemetry.recordedAt)}
            icon={Clock3}
          />
        </div>

        <div className='flex flex-wrap gap-2 text-xs text-muted-foreground'>
          {trip.stops.map((stop) => (
            <span
              key={stop.id}
              className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-1',
                stop.completed
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300'
              )}
            >
              {stop.site.name}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function SignalTile({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType
  label: string
  value: string
}) {
  return (
    <div className='rounded-xl border bg-background px-4 py-3'>
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Icon className='size-3.5' />
        {label}
      </div>
      <p className='mt-2 text-sm font-medium'>{value}</p>
    </div>
  )
}
