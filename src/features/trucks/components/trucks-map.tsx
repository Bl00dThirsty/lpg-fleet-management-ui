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
import lpgSphereIconUrl from '@/assets/lpg-sphere.png'
import lpgCenterSvgRaw from '@/assets/lpg.svg?raw'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  siteStatusLabels,
  siteTypeLabels,
  type Site,
  type SiteType,
} from '@/features/sites/data/sites'
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
  sites: Site[]
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

const siteMarkerTokens: Record<
  SiteType,
  {
    color: [number, number, number, number]
    haloColor: [number, number, number, number]
    iconKind: 'sphere' | 'lpg' | 'marker'
    style: 'circle' | 'diamond' | 'square' | 'triangle' | 'x'
    size: number
    haloSize?: number
    iconWidth?: number
    iconHeight?: number
    swatch: string
  }
> = {
  depot: {
    color: [22, 163, 74, 0.95],
    haloColor: [22, 163, 74, 0.22],
    iconKind: 'sphere',
    style: 'circle',
    size: 26,
    haloSize: 32,
    iconWidth: 26,
    iconHeight: 26,
    swatch: 'rgba(22, 163, 74, 0.95)',
  },
  scdp: {
    color: [59, 130, 246, 0.95],
    haloColor: [59, 130, 246, 0.2],
    iconKind: 'sphere',
    style: 'diamond',
    size: 24,
    haloSize: 30,
    iconWidth: 24,
    iconHeight: 24,
    swatch: 'rgba(59, 130, 246, 0.95)',
  },
  'filling-center': {
    color: [245, 158, 11, 0.95],
    haloColor: [245, 158, 11, 0.2],
    iconKind: 'lpg',
    style: 'square',
    size: 20,
    haloSize: 30,
    iconWidth: 20,
    iconHeight: 20,
    swatch: 'rgba(245, 158, 11, 0.95)',
  },
  marketer: {
    color: [168, 85, 247, 0.95],
    haloColor: [168, 85, 247, 0.95],
    iconKind: 'marker',
    style: 'triangle',
    size: 12,
    swatch: 'rgba(168, 85, 247, 0.95)',
  },
  'delivery-point': {
    color: [236, 72, 153, 0.95],
    haloColor: [236, 72, 153, 0.95],
    iconKind: 'marker',
    style: 'x',
    size: 12,
    swatch: 'rgba(236, 72, 153, 0.95)',
  },
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
      .when()
      .then(() => {
        setLoadFailed(false)
        setIsReady(true)
      })
      .catch((err) => {
        if (err && err.name === 'AbortError') return
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

  const lastAppliedTheme = useRef<MapTheme>(mapTheme)

  useEffect(() => {
    const map = mapRef.current
    const view = viewRef.current
    if (!isReady || !map || !view) return
    if (lastAppliedTheme.current === mapTheme) return

    lastAppliedTheme.current = mapTheme
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
    const siteGraphics = sites.flatMap((site) =>
      createSiteGraphics(site, mapTheme)
    )
    const truckGraphics = trucks.map((truck) =>
      createTruckGraphic(truck, truck.id === selectedTruck.id, mapTheme)
    )

    graphicsLayer.removeAll()
    graphicsLayer.addMany([...routeGraphics, ...siteGraphics, ...truckGraphics])
  }, [isReady, mapTheme, selectedTruck.id, showRoutes, sites, trucks])

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

function getSiteIconUrl(siteType: SiteType, mapTheme: MapTheme) {
  if (siteType === 'filling-center') {
    return getLpgMarkerIcon(mapTheme)
  }

  return lpgSphereIconUrl
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
    ? 'dark-gray-vector'
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

function getSiteOutlineColor(mapTheme: MapTheme): [
  number,
  number,
  number,
  number,
] {
  return mapTheme === 'dark'
    ? [226, 232, 240, 0.84]
    : [15, 23, 42, 0.28]
}

function getLpgMarkerIcon(mapTheme: MapTheme) {
  const fillColor = mapTheme === 'dark' ? '#f8fafc' : '#0f172a'

  return svgToDataUri(lpgCenterSvgRaw.replace(/#000000/g, fillColor))
}

function svgToDataUri(svg: string) {
  const normalizedSvg = svg.replace(/\s+/g, ' ').trim()
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(normalizedSvg)}`
}

function LegendSiteIcon({
  type,
  mapTheme,
}: {
  type: SiteType
  mapTheme: MapTheme
}) {
  const marker = siteMarkerTokens[type]

  if (marker.iconKind === 'marker') {
    return (
      <span
        className='block size-2.5 rounded-full'
        style={{ backgroundColor: marker.swatch }}
      />
    )
  }

  return (
    <span
      className='flex size-6 items-center justify-center rounded-full'
      style={{ backgroundColor: rgbaFromTuple(marker.haloColor) }}
    >
      <img
        src={getSiteIconUrl(type, mapTheme)}
        alt=''
        className='max-h-4 max-w-4 object-contain'
      />
    </span>
  )
}

function rgbaFromTuple(value: [number, number, number, number]) {
  return `rgba(${value[0]}, ${value[1]}, ${value[2]}, ${value[3]})`
}
