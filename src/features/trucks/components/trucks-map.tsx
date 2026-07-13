import { useCallback, useEffect, useRef, useState } from 'react'
import esriConfig from '@arcgis/core/config.js'
import Graphic from '@arcgis/core/Graphic.js'
import Point from '@arcgis/core/geometry/Point.js'
import Polyline from '@arcgis/core/geometry/Polyline.js'
import type { ArcgisMap } from '@arcgis/map-components/components/arcgis-map'
import '@arcgis/map-components/components/arcgis-map'
import '@arcgis/map-components/components/arcgis-popup'
import '@arcgis/map-components/components/arcgis-zoom'
import { AlertTriangle, MapPin, Wifi } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  getTruckTelemetry,
  statusLabels,
  type Truck,
  type TruckStatus,
} from '../data/trucks'

const arcgisApiKey = String(import.meta.env.VITE_ARCGIS_API_KEY ?? '').trim()

if (arcgisApiKey) {
  esriConfig.apiKey = arcgisApiKey
}

type ArcgisMapElement = ArcgisMap & HTMLElement

type ArcgisMapReadyEvent = CustomEvent<void> & {
  target: ArcgisMapElement
}

type ArcgisMapClickEvent = CustomEvent<
  Parameters<ArcgisMapElement['hitTest']>[0]
> & {
  target: ArcgisMapElement
}

type TrucksMapProps = {
  trucks: Truck[]
  selectedTruck: Truck
  showRoutes: boolean
  onSelectTruck: (truck: Truck) => void
}

const statusColors: Record<TruckStatus, [number, number, number, number]> = {
  available: [16, 185, 129, 0.95],
  in_transit: [14, 165, 233, 0.95],
  maintenance: [245, 158, 11, 0.95],
  inactive: [100, 116, 139, 0.9],
}

export function TrucksMap({
  trucks,
  selectedTruck,
  showRoutes,
  onSelectTruck,
}: TrucksMapProps) {
  const mapRef = useRef<ArcgisMapElement | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  const handleViewReady = useCallback((event: ArcgisMapReadyEvent) => {
    mapRef.current = event.target
    setLoadFailed(false)
    setIsReady(true)
  }, [])

  const handleMapClick = useCallback(
    async (event: ArcgisMapClickEvent) => {
      const mapElement = event.target
      const response = await mapElement.hitTest(event.detail)
      const hit = response.results.find((result) => {
        const graphic = (result as { graphic?: Graphic }).graphic
        return graphic?.attributes?.kind === 'truck'
      }) as { graphic?: Graphic } | undefined

      const truckId = hit?.graphic?.attributes?.truckId as string | undefined
      const truck = truckId
        ? trucks.find((candidate) => candidate.id === truckId)
        : undefined

      if (!truck || !hit?.graphic) return

      onSelectTruck(truck)
      await mapElement.openPopup({
        features: [hit.graphic],
        location: hit.graphic.geometry as Point,
      })
    },
    [onSelectTruck, trucks]
  )

  useEffect(() => {
    const mapElement = mapRef.current
    if (!isReady || !mapElement) return

    const routeGraphics = showRoutes
      ? trucks
          .filter((truck) => truck.status === 'in_transit')
          .map((truck) => createRouteGraphic(truck))
      : []
    const truckGraphics = trucks.map((truck) =>
      createTruckGraphic(truck, truck.id === selectedTruck.id)
    )

    mapElement.graphics.removeAll()
    mapElement.graphics.addMany([...routeGraphics, ...truckGraphics])
  }, [isReady, selectedTruck.id, showRoutes, trucks])

  useEffect(() => {
    const mapElement = mapRef.current
    if (!isReady || !mapElement) return

    void mapElement
      .goTo({
        center: [selectedTruck.longitude, selectedTruck.latitude],
        zoom: selectedTruck.status === 'in_transit' ? 8 : 11,
      })
      .catch(() => undefined)
  }, [isReady, selectedTruck])

  if (!arcgisApiKey) {
    return (
      <div className='flex min-h-[440px] items-center justify-center bg-muted/30 p-6 text-center'>
        <div className='max-w-sm space-y-2'>
          <AlertTriangle className='mx-auto size-8 text-amber-500' />
          <p className='text-sm font-medium'>ArcGIS Access Denied</p>
          <p className='text-sm text-muted-foreground'>
           Contact administrator for API key and domain setup to enable map features.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='relative min-h-[440px] overflow-hidden bg-muted'>
      <arcgis-map
        basemap='arcgis/navigation'
        center={`${selectedTruck.longitude}, ${selectedTruck.latitude}`}
        zoom={8}
        className='block h-full min-h-[440px] w-full'
        onarcgisLoadError={() => setLoadFailed(true)}
        onarcgisViewClick={handleMapClick}
        onarcgisViewReadyChange={handleViewReady}
      >
        <arcgis-zoom slot='top-left' />
        <arcgis-popup slot='popup' />
      </arcgis-map>

      <div className='pointer-events-none absolute top-4 left-4 flex flex-wrap items-center gap-2'>
        <Badge className='gap-1 border border-emerald-500/25 bg-background/90 text-foreground shadow-sm backdrop-blur'>
          <Wifi className='size-3 text-emerald-500' />
          ArcGIS
        </Badge>
        <Badge
          variant='outline'
          className='border bg-background/90 shadow-sm backdrop-blur'
        >
          {trucks.length} camions
        </Badge>
      </div>

      <div className='pointer-events-none absolute right-4 bottom-4 max-w-[260px] rounded-lg border bg-background/90 p-3 text-xs shadow-sm backdrop-blur'>
        <div className='flex items-start gap-2'>
          <MapPin className='mt-0.5 size-4 text-primary' />
          <div>
            <p className='font-medium'>{selectedTruck.id}</p>
            <p className='mt-0.5 text-muted-foreground'>
              {selectedTruck.currentLocation}
            </p>
          </div>
        </div>
      </div>

      {loadFailed ? (
        <div className='absolute inset-x-4 top-16 rounded-lg border border-amber-500/30 bg-background/95 px-3 py-2 text-sm text-amber-700 shadow-sm backdrop-blur dark:text-amber-300'>
          La carte ArcGIS n'a pas pu charger. Verifie la cle API et les
          restrictions de domaine.
        </div>
      ) : null}
    </div>
  )
}

function createTruckGraphic(truck: Truck, isSelected: boolean) {
  const telemetry = getTruckTelemetry(truck.id)
  const color = statusColors[truck.status]

  return new Graphic({
    geometry: new Point({
      longitude: truck.longitude,
      latitude: truck.latitude,
      spatialReference: { wkid: 4326 },
    }),
    symbol: {
      type: 'simple-marker',
      style: 'circle',
      color,
      size: isSelected ? 15 : 11,
      outline: {
        color: isSelected ? [255, 255, 255, 1] : [255, 255, 255, 0.85],
        width: isSelected ? 3 : 1.5,
      },
    },
    attributes: {
      kind: 'truck',
      truckId: truck.id,
      status: truck.status,
    },
    popupTemplate: {
      title: `${truck.id} - ${truck.plateNumber}`,
      content: `
        <div>
          <p><strong>Entreprise:</strong> ${truck.tenantName}</p>
          <p><strong>Chauffeur:</strong> ${truck.assignedDriver}</p>
          <p><strong>Statut:</strong> ${statusLabels[truck.status]}</p>
          <p><strong>LPG:</strong> ${telemetry.lpgLevelPercent}%</p>
          <p><strong>Destination:</strong> ${truck.destination}</p>
        </div>
      `,
    },
  })
}

function createRouteGraphic(truck: Truck) {
  return new Graphic({
    geometry: new Polyline({
      paths: [
        [
          [truck.longitude, truck.latitude],
          [truck.destinationLongitude, truck.destinationLatitude],
        ],
      ],
      spatialReference: { wkid: 4326 },
    }),
    symbol: {
      type: 'simple-line',
      color: [245, 158, 11, 0.85],
      width: 3,
      style: 'short-dash',
    },
    attributes: {
      kind: 'route',
      truckId: truck.id,
    },
  })
}
