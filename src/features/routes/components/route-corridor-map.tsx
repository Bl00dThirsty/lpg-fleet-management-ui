import { type ElementType, useEffect, useMemo, useRef, useState } from 'react'
import Graphic from '@arcgis/core/Graphic.js'
import ArcGISMap from '@arcgis/core/Map.js'
import '@arcgis/core/assets/esri/themes/light/main.css'
import esriConfig from '@arcgis/core/config.js'
import Point from '@arcgis/core/geometry/Point.js'
import Polyline from '@arcgis/core/geometry/Polyline.js'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js'
import MapView from '@arcgis/core/views/MapView.js'
import { AlertTriangle, Clock3, MapPinned, Route as RouteIcon, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { siteTypeLabels } from '@/features/sites/data/sites'
import { type RouteTripView } from '../data/routes'

type RouteCorridorMapProps = {
  trip: RouteTripView
  formatDateTime: (value: string) => string
}

type MapTheme = 'light' | 'dark'

const arcgisApiKey = String(import.meta.env.VITE_ARCGIS_API_KEY ?? '').trim()

if (arcgisApiKey) {
  esriConfig.apiKey = arcgisApiKey
}

const stopRoleStyles = {
  loading: {
    color: [34, 197, 94, 0.96] as [number, number, number, number],
    label: 'Chargement',
    style: 'circle' as const,
  },
  checkpoint: {
    color: [56, 189, 248, 0.96] as [number, number, number, number],
    label: 'Checkpoint',
    style: 'diamond' as const,
  },
  delivery: {
    color: [245, 158, 11, 0.96] as [number, number, number, number],
    label: 'Livraison',
    style: 'square' as const,
  },
} as const

export function RouteCorridorMap({
  trip,
  formatDateTime,
}: RouteCorridorMapProps) {
  const { resolvedTheme } = useTheme()
  const mapTheme = resolvedTheme
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<ArcGISMap | null>(null)
  const viewRef = useRef<MapView | null>(null)
  const graphicsLayerRef = useRef<GraphicsLayer | null>(null)
  const initialTripRef = useRef(trip)
  const initialThemeRef = useRef(mapTheme)
  const [isReady, setIsReady] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const stopTotals = useMemo(
    () => ({
      loading: trip.stops.filter((stop) => stop.role === 'loading').length,
      checkpoint: trip.stops.filter((stop) => stop.role === 'checkpoint')
        .length,
      delivery: trip.stops.filter((stop) => stop.role === 'delivery').length,
    }),
    [trip.stops]
  )

  useEffect(() => {
    if (!arcgisApiKey || !mapContainerRef.current) return

    const initialTrip = initialTripRef.current
    const initialTheme = initialThemeRef.current
    const graphicsLayer = new GraphicsLayer({
      title: `Tournee ${initialTrip.reference}`,
    })
    const map = new ArcGISMap({
      basemap: getArcgisBasemap(initialTheme),
      layers: [graphicsLayer],
    })
    const view = new MapView({
      container: mapContainerRef.current,
      map,
      center: [
        initialTrip.latestTelemetry.longitude,
        initialTrip.latestTelemetry.latitude,
      ],
      constraints: {
        minZoom: 4,
      },
      popup: {
        dockEnabled: false,
      },
      theme: getArcgisViewTheme(initialTheme),
      zoom: 8,
    })

    mapRef.current = map
    viewRef.current = view
    graphicsLayerRef.current = graphicsLayer

    view
      .when()
      .then(() => {
        setLoadFailed(false)
        setIsReady(true)
      })
      .catch(() => {
        setLoadFailed(true)
      })

    return () => {
      view.destroy()
      mapRef.current = null
      viewRef.current = null
      graphicsLayerRef.current = null
      setIsReady(false)
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const view = viewRef.current

    if (!isReady || !map || !view) return

    map.basemap = getArcgisBasemap(mapTheme)
    view.theme = getArcgisViewTheme(mapTheme)
  }, [isReady, mapTheme])

  useEffect(() => {
    const graphicsLayer = graphicsLayerRef.current
    const view = viewRef.current

    if (!isReady || !graphicsLayer || !view) return

    const graphics = createRouteGraphics(trip, mapTheme)

    graphicsLayer.removeAll()
    graphicsLayer.addMany(graphics)

    void view
      .goTo(graphics)
      .catch(() => undefined)
  }, [isReady, mapTheme, trip])

  if (!arcgisApiKey) {
    return (
      <Card className='overflow-hidden border-transparent shadow-sm'>
        <CardHeader className='border-b bg-muted/20'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <CardTitle>Carte de tournee</CardTitle>
              <CardDescription>
                Trace GPS entre sites logistiques et point de livraison.
              </CardDescription>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Badge
                variant='outline'
                className='gap-1 border-transparent bg-background/70'
              >
                <RouteIcon className='size-3.5' />
                {trip.routeDistanceKm} km
              </Badge>
              <Badge
                variant='outline'
                className='gap-1 border-transparent bg-background/70'
              >
                <Clock3 className='size-3.5' />
                {formatDateTime(trip.lastUpdatedAt)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4 p-4'>
          <div className='flex h-[320px] items-center justify-center rounded-2xl bg-muted/35 p-6 text-center'>
            <div className='max-w-sm space-y-2'>
              <AlertTriangle className='mx-auto size-8 text-amber-500' />
              <p className='text-sm font-medium'>ArcGIS indisponible</p>
              <p className='text-sm text-muted-foreground'>
                Renseigne `VITE_ARCGIS_API_KEY` dans `.env` pour afficher la
                vraie carte de tournee.
              </p>
            </div>
          </div>
          <MapSignals trip={trip} formatDateTime={formatDateTime} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='overflow-hidden border-transparent shadow-sm'>
      <CardHeader className='border-b bg-muted/20'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <CardTitle>Carte de tournee</CardTitle>
            <CardDescription>
              Trace GPS entre sites logistiques et point de livraison.
            </CardDescription>
          </div>
          <div className='flex flex-wrap gap-2'>
            <Badge
              variant='outline'
              className='gap-1 border-transparent bg-background/70'
            >
              <RouteIcon className='size-3.5' />
              {trip.routeDistanceKm} km
            </Badge>
            <Badge
              variant='outline'
              className='gap-1 border-transparent bg-background/70'
            >
              <Clock3 className='size-3.5' />
              {formatDateTime(trip.lastUpdatedAt)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4 p-4'>
        <div
          className={cn(
            'fleet-arcgis-map relative h-[320px] overflow-hidden rounded-2xl bg-muted/55 shadow-inner',
            mapTheme === 'dark' ? 'calcite-mode-dark' : 'calcite-mode-light'
          )}
          data-map-theme={mapTheme}
        >
          <div
            ref={mapContainerRef}
            className='absolute inset-0 h-full w-full'
          />

          <div className='pointer-events-none absolute top-4 right-4 flex flex-wrap gap-2'>
            <Badge className='gap-1 bg-background/90 text-foreground shadow-sm backdrop-blur'>
              <Truck className='size-3.5 text-sky-500' />
              {trip.truck.id}
            </Badge>
            <Badge
              variant='outline'
              className='border-transparent bg-background/90 shadow-sm backdrop-blur'
            >
              ArcGIS
            </Badge>
          </div>

          {!isReady && !loadFailed ? (
            <div className='pointer-events-none absolute inset-0 flex items-center justify-center bg-background/40 text-sm text-muted-foreground backdrop-blur-[1px]'>
              Chargement de la carte ArcGIS...
            </div>
          ) : null}

          {loadFailed ? (
            <div className='absolute inset-x-4 top-16 rounded-lg border border-amber-500/30 bg-background/95 px-3 py-2 text-sm text-amber-700 shadow-sm backdrop-blur dark:text-amber-300'>
              La carte ArcGIS n'a pas pu charger. Verifie la cle API et les
              restrictions de domaine.
            </div>
          ) : null}
        </div>

        <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
          <span className='font-medium text-foreground'>Legende :</span>
          {Object.entries(stopTotals)
            .filter(([, total]) => total > 0)
            .map(([role, total]) => (
              <span
                key={role}
                className='inline-flex items-center gap-2 rounded-full bg-muted/35 px-2.5 py-1 shadow-xs'
              >
                <span
                  className='size-2 rounded-full'
                  style={{
                    backgroundColor: rgbaFromTuple(
                      stopRoleStyles[role as keyof typeof stopRoleStyles].color
                    ),
                  }}
                />
                {stopRoleStyles[role as keyof typeof stopRoleStyles].label}{' '}
                {total}
              </span>
            ))}
          <span className='inline-flex items-center gap-2 rounded-full bg-muted/35 px-2.5 py-1 shadow-xs'>
            <span className='size-2 rounded-full bg-sky-500' />
            Position camion
          </span>
          <span className='inline-flex items-center gap-2 rounded-full bg-muted/35 px-2.5 py-1 shadow-xs'>
            <span className='size-5 rounded-full bg-sky-500/15 ring-1 ring-sky-500/30' />
            Trace GPS
          </span>
        </div>

        <MapSignals trip={trip} formatDateTime={formatDateTime} />

        <div className='flex flex-wrap gap-2 text-xs text-muted-foreground'>
          {trip.stops.map((stop) => (
            <span
              key={stop.id}
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-1 shadow-xs',
                stop.completed
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'bg-muted/35 text-slate-700 dark:text-slate-300'
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

function MapSignals({
  trip,
  formatDateTime,
}: {
  trip: RouteTripView
  formatDateTime: (value: string) => string
}) {
  return (
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
  )
}

function createRouteGraphics(trip: RouteTripView, mapTheme: MapTheme) {
  const routeCoordinates = [
    [trip.originSite.longitude, trip.originSite.latitude],
    ...trip.telemetry.map((point) => [point.longitude, point.latitude]),
    [trip.destinationSite.longitude, trip.destinationSite.latitude],
  ]

  const routeGraphic = new Graphic({
    geometry: new Polyline({
      paths: [routeCoordinates],
      spatialReference: { wkid: 4326 },
    }),
    symbol: {
      type: 'simple-line',
      color: mapTheme === 'dark' ? [56, 189, 248, 0.95] : [2, 132, 199, 0.9],
      width: 4,
      style: 'solid',
    },
    popupTemplate: {
      title: `Tournee ${trip.reference}`,
      content: createRoutePopupContent(trip),
    },
  })

  const breadcrumbGraphics = trip.telemetry.slice(0, -1).map(
    (point, index) =>
      new Graphic({
        geometry: new Point({
          longitude: point.longitude,
          latitude: point.latitude,
          spatialReference: { wkid: 4326 },
        }),
        symbol: {
          type: 'simple-marker',
          style: 'circle',
          color: [148, 163, 184, 0.68],
          size: index === 0 ? 5 : 4,
          outline: {
            color: getOutlineColor(mapTheme),
            width: 1,
          },
        },
        popupTemplate: {
          title: `Trace GPS ${trip.reference}`,
          content: createTelemetryPopupContent(trip, point.recordedAt, point.lpgLevelPercent, point.pressureBar),
        },
      })
  )

  const stopGraphics = trip.stops.map((stop) => {
    const roleStyle = stopRoleStyles[stop.role]

    return new Graphic({
      geometry: new Point({
        longitude: stop.site.longitude,
        latitude: stop.site.latitude,
        spatialReference: { wkid: 4326 },
      }),
      symbol: {
        type: 'simple-marker',
        style: roleStyle.style,
        color: roleStyle.color,
        size: stop.completed ? 13 : 15,
        outline: {
          color: getOutlineColor(mapTheme),
          width: stop.completed ? 1.5 : 2.5,
        },
      },
      popupTemplate: {
        title: stop.title,
        content: createStopPopupContent(trip, stop),
      },
    })
  })

  const currentTruckGraphic = new Graphic({
    geometry: new Point({
      longitude: trip.latestTelemetry.longitude,
      latitude: trip.latestTelemetry.latitude,
      spatialReference: { wkid: 4326 },
    }),
    symbol: {
      type: 'simple-marker',
      style: 'circle',
      color: [14, 165, 233, 0.98],
      size: 16,
      outline: {
        color: mapTheme === 'dark' ? [248, 250, 252, 1] : [255, 255, 255, 1],
        width: 3,
      },
    },
    popupTemplate: {
      title: `${trip.truck.id} - position courante`,
      content: createCurrentTruckPopupContent(trip),
    },
  })

  return [routeGraphic, ...breadcrumbGraphics, ...stopGraphics, currentTruckGraphic]
}

function createRoutePopupContent(trip: RouteTripView) {
  return `
    <div class="fleet-truck-popup">
      ${popupLine('Client', trip.customerName)}
      ${popupLine('Corridor', `${trip.originSite.city} -> ${trip.destinationSite.city}`)}
      ${popupLine('Charge initiale', formatKg(trip.loadedQuantityKg))}
      ${popupLine('Volume livre', formatKg(trip.deliveredQuantityKg))}
      ${popupLine('Volume restant', formatKg(trip.remainingQuantityKg))}
      ${popupLine('Prochaine etape', trip.nextStop.site.name)}
    </div>
  `
}

function createStopPopupContent(
  trip: RouteTripView,
  stop: RouteTripView['stops'][number]
) {
  return `
    <div class="fleet-truck-popup">
      ${popupLine('Role', stopRoleStyles[stop.role].label)}
      ${popupLine('Site', stop.site.name)}
      ${popupLine('Type site', siteTypeLabels[stop.site.type])}
      ${popupLine('Statut', stop.completed ? 'Termine' : 'En attente')}
      ${popupLine('Fenetre', stop.windowLabel)}
      ${popupLine('Tournee', trip.reference)}
    </div>
  `
}

function createCurrentTruckPopupContent(trip: RouteTripView) {
  return `
    <div class="fleet-truck-popup">
      ${popupLine('Camion', trip.truck.plateNumber)}
      ${popupLine('Position', trip.truck.currentLocation)}
      ${popupLine('GPL', `${trip.latestTelemetry.lpgLevelPercent}%`)}
      ${popupLine('Volume estime', formatKg(trip.latestTelemetry.estimatedVolumeKg))}
      ${popupLine('Pression', `${trip.latestTelemetry.pressureBar.toFixed(1)} bar`)}
      ${popupLine('Dernier releve', new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
      }).format(new Date(trip.latestTelemetry.recordedAt)))}
    </div>
  `
}

function createTelemetryPopupContent(
  trip: RouteTripView,
  recordedAt: string,
  lpgLevelPercent: number,
  pressureBar: number
) {
  return `
    <div class="fleet-truck-popup">
      ${popupLine('Tournee', trip.reference)}
      ${popupLine('Releve', new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
      }).format(new Date(recordedAt)))}
      ${popupLine('GPL', `${lpgLevelPercent}%`)}
      ${popupLine('Pression', `${pressureBar.toFixed(1)} bar`)}
    </div>
  `
}

function popupLine(label: string, value: string) {
  return `
    <p class="fleet-truck-popup__row">
      <strong>${escapePopupValue(label)}</strong>
      <span>${escapePopupValue(value)}</span>
    </p>
  `
}

function escapePopupValue(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }

    return entities[character] ?? character
  })
}

function getArcgisBasemap(mapTheme: MapTheme) {
  return mapTheme === 'dark'
    ? 'streets-night-vector'
    : 'streets-navigation-vector'
}

function getArcgisViewTheme(mapTheme: MapTheme) {
  return mapTheme === 'dark'
    ? {
        accentColor: '#86efac',
        textColor: '#f8fafc',
      }
    : {
        accentColor: '#16a34a',
        textColor: '#0f172a',
      }
}

function getOutlineColor(mapTheme: MapTheme): [number, number, number, number] {
  return mapTheme === 'dark'
    ? [226, 232, 240, 0.95]
    : [255, 255, 255, 0.95]
}

function rgbaFromTuple(value: [number, number, number, number]) {
  return `rgba(${value[0]}, ${value[1]}, ${value[2]}, ${value[3]})`
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
    <div className='rounded-xl bg-muted/30 px-4 py-3 shadow-xs'>
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Icon className='size-3.5' />
        {label}
      </div>
      <p className='mt-2 text-sm font-medium'>{value}</p>
    </div>
  )
}

function formatKg(value: number) {
  return `${new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(value)} kg`
}
