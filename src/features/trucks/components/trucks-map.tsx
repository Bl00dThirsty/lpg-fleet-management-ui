import { useEffect, useRef, useState } from 'react'
import Graphic from '@arcgis/core/Graphic.js'
import ArcGISMap from '@arcgis/core/Map.js'
import '@arcgis/core/assets/esri/themes/light/main.css'
import esriConfig from '@arcgis/core/config.js'
import Point from '@arcgis/core/geometry/Point.js'
import Polyline from '@arcgis/core/geometry/Polyline.js'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js'
import MapView from '@arcgis/core/views/MapView.js'
import type { ClickEvent } from '@arcgis/core/views/input/types.js'
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

type TrucksMapProps = {
  trucks: Truck[]
  selectedTruck: Truck
  mapTheme: MapTheme
  showRoutes: boolean
  onSelectTruck: (truck: Truck) => void
}

type MapTheme = 'light' | 'dark'

type HitTestResults = Awaited<ReturnType<MapView['hitTest']>>['results']

const statusColors: Record<TruckStatus, [number, number, number, number]> = {
  available: [16, 185, 129, 0.95],
  in_transit: [14, 165, 233, 0.95],
  maintenance: [245, 158, 11, 0.95],
  inactive: [100, 116, 139, 0.9],
}

export function TrucksMap({
  trucks,
  selectedTruck,
  mapTheme,
  showRoutes,
  onSelectTruck,
}: TrucksMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<ArcGISMap | null>(null)
  const viewRef = useRef<MapView | null>(null)
  const graphicsLayerRef = useRef<GraphicsLayer | null>(null)
  const trucksRef = useRef(trucks)
  const onSelectTruckRef = useRef(onSelectTruck)
  const initialTruckRef = useRef(selectedTruck)
  const initialThemeRef = useRef(mapTheme)
  const [isReady, setIsReady] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    trucksRef.current = trucks
  }, [trucks])

  useEffect(() => {
    onSelectTruckRef.current = onSelectTruck
  }, [onSelectTruck])

  useEffect(() => {
    if (!arcgisApiKey || !mapContainerRef.current) return

    const initialTruck = initialTruckRef.current
    const initialTheme = initialThemeRef.current
    const graphicsLayer = new GraphicsLayer({
      title: 'Camions LPG',
    })
    const map = new ArcGISMap({
      basemap: getArcgisBasemap(initialTheme),
      layers: [graphicsLayer],
    })
    const view = new MapView({
      container: mapContainerRef.current,
      map,
      center: [initialTruck.longitude, initialTruck.latitude],
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
    graphicsLayerRef.current = graphicsLayer
    viewRef.current = view

    const clickHandle = view.on('click', async (event: ClickEvent) => {
      const response = await view.hitTest(event)
      const hit = findTruckGraphicHit(response.results)

      const truckId = hit?.graphic?.attributes?.truckId as string | undefined
      const truck = truckId
        ? trucksRef.current.find((candidate) => candidate.id === truckId)
        : undefined

      if (!truck || !hit?.graphic) return

      onSelectTruckRef.current(truck)
      await openTruckPopup(view, hit.graphic)
    })

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
      clickHandle.remove()
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
    if (!isReady || !graphicsLayer) return

    const routeGraphics = showRoutes
      ? trucks
          .filter((truck) => truck.status === 'in_transit')
          .map((truck) => createRouteGraphic(truck, mapTheme))
      : []
    const truckGraphics = trucks.map((truck) =>
      createTruckGraphic(truck, truck.id === selectedTruck.id, mapTheme)
    )

    graphicsLayer.removeAll()
    graphicsLayer.addMany([...routeGraphics, ...truckGraphics])
  }, [isReady, mapTheme, selectedTruck.id, showRoutes, trucks])

  useEffect(() => {
    const view = viewRef.current
    if (!isReady || !view) return

    void view
      .goTo({
        center: [selectedTruck.longitude, selectedTruck.latitude],
        zoom: selectedTruck.status === 'in_transit' ? 8 : 11,
      })
      .catch(() => undefined)
  }, [isReady, selectedTruck])

  if (!arcgisApiKey) {
    return (
      <div className='flex min-h-[560px] items-center justify-center bg-muted/30 p-6 text-center md:min-h-[620px]'>
        <div className='max-w-sm space-y-2'>
          <AlertTriangle className='mx-auto size-8 text-amber-500' />
          <p className='text-sm font-medium'>ArcGIS </p>
          <p className='text-sm text-muted-foreground'>
            Renseigne VITE_ARCGIS_API_KEY dans le fichier .env pour charger la
            carte.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className='fleet-arcgis-map relative min-h-[560px] overflow-hidden bg-muted md:min-h-[620px]'
      data-map-theme={mapTheme}
    >
      <div
        ref={mapContainerRef}
        className='absolute inset-0 h-full min-h-[560px] w-full md:min-h-[620px]'
      />

      <div className='pointer-events-none absolute top-4 right-16 flex flex-wrap items-center justify-end gap-2'>
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

      {!isReady && !loadFailed ? (
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center bg-background/40 text-sm text-muted-foreground backdrop-blur-[1px]'>
          Chargement de la carte ArcGIS...
        </div>
      ) : null}

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

function createTruckGraphic(
  truck: Truck,
  isSelected: boolean,
  mapTheme: MapTheme
) {
  const telemetry = getTruckTelemetry(truck.id)
  const color = statusColors[truck.status]
  const outlineColor = getMarkerOutlineColor(mapTheme, isSelected)

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
        color: outlineColor,
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
      content: createTruckPopupContent(truck, telemetry, mapTheme),
    },
  })
}

function findTruckGraphicHit(results: HitTestResults) {
  return results.find((result) => {
    const graphic = (result as { graphic?: Graphic }).graphic
    return graphic?.attributes?.kind === 'truck'
  }) as { graphic?: Graphic } | undefined
}

async function openTruckPopup(view: MapView, graphic: Graphic) {
  await view.openPopup({
    features: [graphic],
    location: graphic.geometry as Point,
  })
}

function createTruckPopupContent(
  truck: Truck,
  telemetry: ReturnType<typeof getTruckTelemetry>,
  mapTheme: MapTheme
) {
  const loadedLiters = Math.round(
    (truck.tankCapacityLiters * telemetry.lpgLevelPercent) / 100
  )

  return `
    <div class="fleet-truck-popup" data-popup-theme="${mapTheme}">
      ${popupLine('Entreprise', truck.tenantName)}
      ${popupLine('Chauffeur', truck.assignedDriver)}
      ${popupLine('Telephone', truck.driverPhone)}
      ${popupLine('Statut', statusLabels[truck.status])}
      ${popupLine('Position', truck.currentLocation)}
      ${popupLine('Route', truck.assignedRoute)}
      ${popupLine('Destination', truck.destination)}
      ${popupLine('Niveau GPL', `${telemetry.lpgLevelPercent}%`)}
      ${popupLine('Charge GPL', `${loadedLiters.toLocaleString('fr-FR')} L`)}
      ${popupLine('Pression', `${telemetry.pressureBar.toFixed(1)} bar`)}
      ${popupLine('ETA', telemetry.etaText)}
    </div>
  `
}

function popupLine(label: string, value: string) {
  return `
    <p class="fleet-truck-popup__row">
      <strong>${label}</strong>
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

function createRouteGraphic(truck: Truck, mapTheme: MapTheme) {
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
      color: mapTheme === 'dark' ? [250, 204, 21, 0.9] : [217, 119, 6, 0.85],
      width: 3,
      style: 'short-dash',
    },
    attributes: {
      kind: 'route',
      truckId: truck.id,
    },
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

function getMarkerOutlineColor(
  mapTheme: MapTheme,
  isSelected: boolean
): [number, number, number, number] {
  if (mapTheme === 'dark') {
    return isSelected ? [248, 250, 252, 1] : [226, 232, 240, 0.86]
  }

  return isSelected ? [255, 255, 255, 1] : [15, 23, 42, 0.28]
}
