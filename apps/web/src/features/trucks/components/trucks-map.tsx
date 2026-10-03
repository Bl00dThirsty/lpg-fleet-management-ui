import { useEffect, useMemo, useRef, useState } from 'react'
import Graphic from '@arcgis/core/Graphic.js'
import ArcGISMap from '@arcgis/core/Map.js'
import '@arcgis/core/assets/esri/themes/light/main.css'
import esriConfig from '@arcgis/core/config.js'
import Point from '@arcgis/core/geometry/Point.js'
import Polyline from '@arcgis/core/geometry/Polyline.js'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js'
import MapView from '@arcgis/core/views/MapView.js'
import type { ClickEvent } from '@arcgis/core/views/input/types.js'
import { AlertTriangle, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  siteStatusLabels,
  siteTypeLabels,
  type Site,
  type SiteType,
} from '@/features/sites/data/sites'
import { siteMarkerTokens } from '@/features/sites/utils/site-graphics'
import {
  getArcgisBasemap,
  getArcgisViewTheme,
  getMarkerOutlineColor,
  getSiteOutlineColor,
  getSiteIconUrl,
} from '@/features/map/utils/map-theme'
import type { MapTheme } from '@/features/map/utils/map-theme'
import { LegendSiteIcon } from '@/features/map/utils/legend'
import {
  getTruckTelemetry,
  statusLabels,
  type Truck,
  type TruckStatus,
} from '../data/trucks'
import { quantityInfo } from '../lib/quantity'
import { activeTourForVehicle } from '@/features/tours/data/active-tour'
import { useToursStore } from '@/store/tours-store'
import { useRoadRoutes } from '@/features/map/data/road-routes'
import { projectOnRoad, type RoadCoordinate, type RoadRoute } from '@/features/map/lib/road-routing'
import { createRobustBasemap } from '@/features/map/utils/robust-basemap'

const arcgisApiKey = String(import.meta.env.VITE_ARCGIS_API_KEY ?? '')
  .trim()
  .replace(/^["']|["']$/g, '')

if (arcgisApiKey && arcgisApiKey.length > 20) {
  esriConfig.apiKey = arcgisApiKey
}

type TrucksMapProps = {
  sites: Site[]
  trucks: Truck[]
  selectedTruck: Truck
  mapTheme: MapTheme
  showRoutes: boolean
  onSelectTruck: (truck: Truck) => void
}

type HitTestResults = Awaited<ReturnType<MapView['hitTest']>>['results']

const statusColors: Record<TruckStatus, [number, number, number, number]> = {
  DRAFT: [100, 116, 139, 0.9],
  PLANNED: [14, 165, 233, 0.95],
  PENDINGTRANSPORTERACK: [245, 158, 11, 0.95],
  ACKNOWLEDGED: [16, 185, 129, 0.95],
  INPROGRESS: [14, 165, 233, 0.95],
  CHECKPOINTACTIVE: [168, 85, 247, 0.95],
  CLOSED: [100, 116, 139, 0.9],
  CANCELLED: [239, 68, 68, 0.95],
}

export function TrucksMap({
  sites,
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
  const tours = useToursStore((state) => state.tours)
  const routeTrips = useMemo(() => trucks.map((truck) => ({
    truck,
    trip: activeTourForVehicle(truck.id, tours),
  })).filter((entry) => entry.trip !== null), [trucks, tours])
  const roadQueries = useRoadRoutes(routeTrips.map(({ trip }) => ({ stops: [
    [trip!.originSite.longitude, trip!.originSite.latitude],
    ...trip!.stops.map((stop): RoadCoordinate => [stop.site.longitude, stop.site.latitude]),
    [trip!.destinationSite.longitude, trip!.destinationSite.latitude],
  ] })), showRoutes)
  const roads = useMemo(() => new Map(routeTrips.map(({ truck }, index) => [truck.id, roadQueries[index]?.data])), [routeTrips, roadQueries])
  const siteTotals = useMemo(() => {
    const totals = {
      depot: 0,
      scdp: 0,
      'filling-center': 0,
      marketer: 0,
      'delivery-point': 0,
    } satisfies Record<SiteType, number>

    for (const site of sites) {
      totals[site.type] += 1
    }

    return totals
  }, [sites])

  useEffect(() => {
    trucksRef.current = trucks
  }, [trucks])

  useEffect(() => {
    onSelectTruckRef.current = onSelectTruck
  }, [onSelectTruck])

  useEffect(() => {
    if (!mapContainerRef.current) return

    const initialTruck = initialTruckRef.current
    const initialTheme = initialThemeRef.current
    const graphicsLayer = new GraphicsLayer({
      title: 'Camions LPG',
    })
    const initialBasemap = arcgisApiKey
      ? getArcgisBasemap(initialTheme)
      : createRobustBasemap(initialTheme)
    const map = new ArcGISMap({
      basemap: initialBasemap,
      layers: [graphicsLayer],
    })
    map.basemap?.load?.().catch(() => {
      map.basemap = createRobustBasemap(initialTheme)
    })
    const view = new MapView({
      container: mapContainerRef.current,
      map,
      center: [initialTruck.lng, initialTruck.lat],
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
      const truckHit = findGraphicHit(response.results, 'truck')
      const siteHit = findGraphicHit(response.results, 'site')

      const truckId = truckHit?.graphic?.attributes?.truckId as
        | string
        | undefined
      const truck = truckId
        ? trucksRef.current.find((candidate) => candidate.id === truckId)
        : undefined

      if (truck && truckHit?.graphic) {
        onSelectTruckRef.current(truck)
        await openGraphicPopup(view, truckHit.graphic)
        return
      }

      if (!siteHit?.graphic) return

      await openGraphicPopup(view, siteHit.graphic)
    })

    view
      .when(() => {
        setLoadFailed(false)
        setIsReady(true)
      })
      .catch((err) => {
        if (err && err.name === 'AbortError') return
        console.warn('Trucks map view load warning, switching to robust basemap:', err)
        map.basemap = createRobustBasemap(initialTheme)
        setLoadFailed(false)
        setIsReady(true)
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

  const lastAppliedTheme = useRef<MapTheme>(mapTheme)

  useEffect(() => {
    const map = mapRef.current
    const view = viewRef.current
    if (!isReady || !map || !view) return
    if (lastAppliedTheme.current === mapTheme) return

    lastAppliedTheme.current = mapTheme
    const targetBasemap = arcgisApiKey ? getArcgisBasemap(mapTheme) : createRobustBasemap(mapTheme)
    map.basemap = targetBasemap
    map.basemap?.load?.().catch(() => {
      map.basemap = createRobustBasemap(mapTheme)
    })
    view.theme = getArcgisViewTheme(mapTheme)
  }, [isReady, mapTheme])

  useEffect(() => {
    const graphicsLayer = graphicsLayerRef.current
    if (!isReady || !graphicsLayer) return

    const routeGraphics = showRoutes
      ? trucks.flatMap((truck) => {
          const road = roads.get(truck.id)
          return road ? [createRouteGraphic(truck, road)] : []
        })
      : []
    const siteGraphics = sites.flatMap((site) =>
      createSiteGraphics(site, mapTheme)
    )
    const truckGraphics = trucks.map((truck) =>
      createTruckGraphic(
        (import.meta.env.VITE_API_MODE ?? 'fake') === 'fake' && roads.get(truck.id)
          ? { ...truck, lng: projectOnRoad([truck.lng, truck.lat], roads.get(truck.id)!.paths)[0],
              lat: projectOnRoad([truck.lng, truck.lat], roads.get(truck.id)!.paths)[1] }
          : truck,
        truck.id === selectedTruck.id, mapTheme)
    )

    graphicsLayer.removeAll()
    graphicsLayer.addMany([...routeGraphics, ...siteGraphics, ...truckGraphics])
  }, [isReady, mapTheme, selectedTruck.id, showRoutes, sites, trucks, roads])

  useEffect(() => {
    const view = viewRef.current
    if (!isReady || !view) return

    void view
      .goTo({
        center: [selectedTruck.lng, selectedTruck.lat],
        zoom: selectedTruck.tournee_status === 'INPROGRESS' ? 8 : 11,
      })
      .catch(() => undefined)
  }, [isReady, selectedTruck])

  if (loadFailed) {
    return (
      <div className='flex min-h-[560px] items-center justify-center bg-muted/30 p-6 text-center md:min-h-[620px]'>
        <div className='max-w-sm space-y-2'>
          <AlertTriangle className='mx-auto size-8 text-amber-500' />
          <p className='text-sm font-medium'>Carte indisponible</p>
          <p className='text-sm text-muted-foreground'>
            Vérifiez la connexion réseau pour charger les données cartographiques.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'fleet-arcgis-map relative min-h-[560px] overflow-hidden bg-muted md:min-h-[620px]',
        mapTheme === 'dark' ? 'calcite-mode-dark' : 'calcite-mode-light'
      )}
      data-map-theme={mapTheme}
    >
      <div
        ref={mapContainerRef}
        className='absolute inset-0 h-full min-h-[560px] w-full md:min-h-[620px]'
      />

      <div className='pointer-events-none absolute top-4 right-16 flex flex-wrap items-center justify-end gap-2'>
        <Badge className='gap-1 border-transparent bg-background/90 text-foreground shadow-sm backdrop-blur'>
          <Wifi className='size-3 text-emerald-500' />
          ArcGIS
        </Badge>
        <Badge
          variant='outline'
          className='border-transparent bg-background/90 shadow-sm backdrop-blur'
        >
          {trucks.length} camions
        </Badge>
        {sites.length > 0 ? (
          <Badge
            variant='outline'
            className='border-transparent bg-background/90 shadow-sm backdrop-blur'
          >
            {sites.length} sites
          </Badge>
        ) : null}
      </div>

      {showRoutes && (
        <div role='status' className='absolute bottom-4 left-4 rounded-lg bg-background/95 px-3 py-2 text-xs shadow-sm'>
          {roadQueries.some((query) => query.isError)
            ? 'Certains trajets routiers sont indisponibles.'
            : roadQueries.some((query) => query.isPending)
              ? 'Calcul des trajets routiers…'
              : roads.size ? 'Itinéraires routiers ArcGIS' : 'Aucune tournée active à afficher.'}
        </div>
      )}
      {!isReady && !loadFailed ? (
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center bg-background/40 text-sm text-muted-foreground backdrop-blur-[1px]'>
          Chargement de la carte ArcGIS...
        </div>
      ) : null}

      {sites.length > 0 ? (
        <div className='pointer-events-none absolute bottom-20 left-4 max-w-[260px] rounded-2xl bg-background/70 p-3 text-xs shadow-sm backdrop-blur-md'>
          <p className='font-medium text-foreground/90'>Reseau logistique seed</p>
          <div className='mt-2 space-y-2'>
            {Object.entries(siteTotals)
              .filter(([, count]) => count > 0)
              .map(([type, count]) => (
                <div
                  key={type}
                  className='flex items-center justify-between gap-3'
                >
                  <span className='inline-flex items-center gap-2 text-muted-foreground'>
                    <span
                      className='shrink-0'
                    >
                      <LegendSiteIcon
                        type={type as SiteType}
                        mapTheme={mapTheme}
                      />
                    </span>
                    {siteTypeLabels[type as SiteType]}
                  </span>
                  <span className='font-medium text-foreground'>{count}</span>
                </div>
              ))}
          </div>
        </div>
      ) : null}

      {loadFailed ? (
        <div className='absolute inset-x-4 top-16 rounded-lg bg-background/95 px-3 py-2 text-sm text-amber-700 shadow-sm backdrop-blur dark:text-amber-300'>
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
  const color = statusColors[truck.tournee_status]
  const outlineColor = getMarkerOutlineColor(mapTheme, isSelected)

  return new Graphic({
    geometry: new Point({
      longitude: truck.lng,
      latitude: truck.lat,
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
      status: truck.tournee_status,
    },
    popupTemplate: {
      title: `${truck.id} - ${truck.license_plate}`,
      content: createTruckPopupContent(truck, telemetry, mapTheme),
    },
  })
}

function createSiteGraphics(site: Site, mapTheme: MapTheme) {
  const outlineColor = getSiteOutlineColor(mapTheme)
  const marker = siteMarkerTokens[site.type]
  const popupTemplate = {
    title: site.name,
    content: createSitePopupContent(site, mapTheme),
  }
  const baseAttributes = {
    kind: 'site',
    siteId: site.id,
    siteType: site.type,
  }

  if (marker.iconKind === 'marker') {
    return [
      new Graphic({
        geometry: new Point({
          longitude: site.longitude,
          latitude: site.latitude,
          spatialReference: { wkid: 4326 },
        }),
        symbol: {
          type: 'simple-marker',
          style: marker.style,
          color: marker.color,
          size: marker.size,
          outline: {
            color: outlineColor,
            width: 1.5,
          },
        },
        attributes: baseAttributes,
        popupTemplate,
      }),
    ]
  }

  return [
    new Graphic({
      geometry: new Point({
        longitude: site.longitude,
        latitude: site.latitude,
        spatialReference: { wkid: 4326 },
      }),
      symbol: {
        type: 'simple-marker',
        style: 'circle',
        color: marker.haloColor,
        size: marker.haloSize ?? marker.size + 10,
        outline: {
          color: outlineColor,
          width: 1.5,
        },
      },
      attributes: baseAttributes,
      popupTemplate,
    }),
    new Graphic({
      geometry: new Point({
        longitude: site.longitude,
        latitude: site.latitude,
        spatialReference: { wkid: 4326 },
      }),
      symbol: {
        type: 'picture-marker',
        url: getSiteIconUrl(site.type, mapTheme),
        width: marker.iconWidth ?? marker.size,
        height: marker.iconHeight ?? marker.size,
      },
      attributes: baseAttributes,
      popupTemplate,
    }),
  ]
}

function findGraphicHit(results: HitTestResults, kind: 'truck' | 'site') {
  return results.find((result) => {
    const graphic = (result as { graphic?: Graphic }).graphic
    return graphic?.attributes?.kind === kind
  }) as { graphic?: Graphic } | undefined
}

async function openGraphicPopup(view: MapView, graphic: Graphic) {
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
  const info = quantityInfo(truck)
  const etaText = telemetry.expected_arrival
    ? new Date(telemetry.expected_arrival).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

  return `
    <div class="fleet-truck-popup" data-popup-theme="${mapTheme}">
      ${popupLine('Type', truck.type)}
      ${popupLine('Plaque', truck.license_plate)}
      ${popupLine('Entreprise', truck.tenant_name)}
      ${popupLine('Chauffeur', truck.assigned_driver)}
      ${popupLine('Statut', statusLabels[truck.tournee_status])}
      ${popupLine('Position', truck.current_location)}
      ${popupLine('Niveau GPL', info.amount)}
      ${popupLine('Remplissage', `${info.percent}%`)}
      ${popupLine('ETA', etaText)}
    </div>
  `
}

function createSitePopupContent(site: Site, mapTheme: MapTheme) {
  return `
    <div class="fleet-truck-popup" data-popup-theme="${mapTheme}">
      ${popupLine('Type', siteTypeLabels[site.type])}
      ${popupLine('Operateur', site.operator)}
      ${popupLine('Ville', site.city)}
      ${popupLine('Region', site.region)}
      ${popupLine('Statut', siteStatusLabels[site.status])}
      ${popupLine('Role', site.description)}
    </div>
  `
}

function popupLine(label: string, value: string | undefined) {
  return `
    <p class="fleet-truck-popup__row">
      <strong>${label}</strong>
      <span>${escapePopupValue(value)}</span>
    </p>
  `
}

function escapePopupValue(value: string | undefined) {
  return (value ?? '—').replace(/[&<>"']/g, (character) => {
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

function createRouteGraphic(truck: Truck, road: RoadRoute) {
  return new Graphic({
    geometry: new Polyline({
      paths: road.paths,
      spatialReference: { wkid: 4326 },
    }),
    symbol: {
      type: 'simple-line',
      color: [250, 204, 21, 0.9],
      width: 3,
      style: 'solid',
    },
    attributes: {
      kind: 'route',
      truckId: truck.id,
    },
  })
}
