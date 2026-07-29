import { useEffect, useMemo, useRef, useState } from 'react'
import Graphic from '@arcgis/core/Graphic.js'
import ArcGISMap from '@arcgis/core/Map.js'
import '@arcgis/core/assets/esri/themes/light/main.css'
import esriConfig from '@arcgis/core/config.js'
import Point from '@arcgis/core/geometry/Point.js'
import Polyline from '@arcgis/core/geometry/Polyline.js'
import Polygon from '@arcgis/core/geometry/Polygon.js'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer.js'
import MapView from '@arcgis/core/views/MapView.js'
import type { ClickEvent } from '@arcgis/core/views/input/types.js'
import { useTheme } from '@/context/theme-provider'
import { Badge, Card, CardContent, cn, ScrollArea, Separator, Switch } from '@lpg/ui'
import { AlertTriangle, Layers, Radio, Truck as TruckIcon, MapPin, Flame, Route } from 'lucide-react'
import {
  siteTypeLabels,
  siteStatusLabels,
  type Site,
  type SiteType,
} from '@/features/sites/sites'
import {
  getTruckTelemetry,
  statusLabels,
  type Truck,
  type TruckStatus,
} from '@/features/trucks/trucks'
import { getRouteTripsView } from '@/features/routes/routes'
import { sites as SITES } from '@/features/sites/sites'
import { trucks as TRUCKS } from '@/features/trucks/trucks'
import { ARCGIS_API_KEY } from '@lpg/config'

const arcgisApiKey = ARCGIS_API_KEY.trim()
if (arcgisApiKey) esriConfig.apiKey = arcgisApiKey

type MapTheme = 'light' | 'dark'

const siteColors: Record<SiteType, [number, number, number, number]> = {
  depot: [22, 163, 74, 0.95],
  scdp: [59, 130, 246, 0.95],
  'filling-center': [245, 158, 11, 0.95],
  marketer: [168, 85, 247, 0.95],
  'delivery-point': [236, 72, 153, 0.95],
}

const truckColors: Record<TruckStatus, [number, number, number, number]> = {
  available: [16, 185, 129, 0.95],
  in_transit: [14, 165, 233, 0.95],
  maintenance: [245, 158, 11, 0.95],
  inactive: [100, 116, 139, 0.9],
}

const CAMEROON_CENTER: [number, number] = [11.5, 5.5]

type LayerKey = 'sites' | 'trucks' | 'supply' | 'checkpoints' | 'heatmap' | 'zones'

const ZONES: { id: string; name: string; kind: 'coverage' | 'interdit'; ring: number[][][] }[] = [
  {
    id: 'zone-douala',
    name: 'Zone de couverture Douala',
    kind: 'coverage',
    ring: [
      [
        [9.6, 3.9],
        [9.9, 4.1],
        [10.1, 4.0],
        [10.0, 3.7],
        [9.6, 3.7],
        [9.6, 3.9],
      ],
    ],
  },
  {
    id: 'zone-interdit-nord',
    name: 'Zone interdite (Nord)',
    kind: 'interdit',
    ring: [
      [
        [13.0, 8.5],
        [14.5, 9.0],
        [14.5, 8.0],
        [13.0, 7.8],
        [13.0, 8.5],
      ],
    ],
  },
]

export function SuperAdminMapScreen() {
  const { resolvedTheme } = useTheme()
  const mapTheme: MapTheme = resolvedTheme === 'dark' ? 'dark' : 'light'

  const sites = useMemo(() => SITES, [])
  const trucks = useMemo(() => TRUCKS, [])
  const trips = useMemo(() => getRouteTripsView(), [])
  const siteById = useMemo(() => new Map(sites.map((s) => [s.id, s])), [sites])

  const alerts = useMemo(
    () =>
      trips
        .filter((t) => t.status === 'incident')
        .map((t) => ({
          id: t.id,
          title: `Incident — ${t.reference}`,
          truckId: t.truckId,
          target: [truckById(t.truckId)?.longitude ?? CAMEROON_CENTER[0], truckById(t.truckId)?.latitude ?? CAMEROON_CENTER[1]] as [number, number],
        })),
    [trips]
  )

  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    sites: true,
    trucks: true,
    supply: true,
    checkpoints: true,
    heatmap: false,
    zones: true,
  })

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<MapView | null>(null)
  const layerRefs = useRef<Record<LayerKey, GraphicsLayer | FeatureLayer | null>>({
    sites: null,
    trucks: null,
    supply: null,
    checkpoints: null,
    heatmap: null,
    zones: null,
  })
  const layersRef = useRef(layers)
  const [isReady, setIsReady] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    layersRef.current = layers
  }, [layers])

  useEffect(() => {
    if (!arcgisApiKey || !mapContainerRef.current) return

    const sitesLayer = new GraphicsLayer({ title: 'Sites' })
    const trucksLayer = new GraphicsLayer({ title: 'Camions' })
    const supplyLayer = new GraphicsLayer({ title: ' Flux approvisionnement' })
    const checkpointsLayer = new GraphicsLayer({ title: 'Checkpoints livraison' })
    const zonesLayer = new GraphicsLayer({ title: 'Zones' })
    const heatLayer = buildHeatLayer([...trucks, ...sites])

    layerRefs.current = {
      sites: sitesLayer,
      trucks: trucksLayer,
      supply: supplyLayer,
      checkpoints: checkpointsLayer,
      zones: zonesLayer,
      heatmap: heatLayer,
    }

    const map = new ArcGISMap({
      basemap: mapTheme === 'dark' ? 'dark-gray-vector' : 'streets-navigation-vector',
      layers: [zonesLayer, heatLayer, supplyLayer, checkpointsLayer, sitesLayer, trucksLayer],
    })

    const view = new MapView({
      container: mapContainerRef.current,
      map,
      center: CAMEROON_CENTER,
      zoom: 6,
      constraints: { minZoom: 4, maxZoom: 18 },
      popup: { dockEnabled: true, dockOptions: { position: 'top-right' } },
      theme:
        mapTheme === 'dark'
          ? { accentColor: '#86efac', textColor: '#f8fafc' }
          : { accentColor: '#16a34a', textColor: '#0f172a' },
    })
    viewRef.current = view

    const clickHandle = view.on('click', async (event: ClickEvent) => {
      const res = await view.hitTest(event)
      const hit = res.results.find((r) => (r as { graphic?: Graphic }).graphic)
      const graphic = (hit as { graphic?: Graphic })?.graphic
      if (graphic) await view.openPopup({ features: [graphic], location: graphic.geometry as Point })
    })

    view
      .when()
      .then(() => {
        setLoadFailed(false)
        setIsReady(true)
        applyLayerVisibility()
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return
        setLoadFailed(true)
      })

    return () => {
      clickHandle.remove()
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function applyLayerVisibility() {
    const cur = layersRef.current
    for (const key of Object.keys(layerRefs.current) as LayerKey[]) {
      const lyr = layerRefs.current[key]
      if (lyr) lyr.visible = cur[key]
    }
  }

  useEffect(() => {
    if (!isReady) return
    // refresh graphics when themes/toggles change
    const sitesLayer = layerRefs.current.sites as GraphicsLayer | null
    const trucksLayer = layerRefs.current.trucks as GraphicsLayer | null
    const supplyLayer = layerRefs.current.supply as GraphicsLayer | null
    const checkpointsLayer = layerRefs.current.checkpoints as GraphicsLayer | null
    const zonesLayer = layerRefs.current.zones as GraphicsLayer | null

    sitesLayer?.removeAll()
    sitesLayer?.addMany(sites.map((s) => createSiteGraphic(s, mapTheme)))

    trucksLayer?.removeAll()
    trucksLayer?.addMany(trucks.map((t) => createTruckGraphic(t, mapTheme)))

    supplyLayer?.removeAll()
    supplyLayer?.addMany(
      trips
        .filter((t) => t.status === 'in-progress' || t.status === 'planned')
        .map((t) => {
          const o = siteById.get(t.originSiteId)
          const d = siteById.get(t.destinationSiteId)
          if (!o || !d) return null
          return createRouteGraphic(o, d, mapTheme)
        })
        .filter(Boolean) as Graphic[]
    )

    checkpointsLayer?.removeAll()
    checkpointsLayer?.addMany(
      trips.flatMap((t) =>
        (t.stops ?? []).map((stop) =>
          createCheckpointGraphic(stop.site, stop.title, stop.role, mapTheme)
        )
      )
    )

    zonesLayer?.removeAll()
    zonesLayer?.addMany(ZONES.map((z) => createZoneGraphic(z)))

    applyLayerVisibility()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, mapTheme, layers, sites, trucks, trips, siteById])

  const goTo = (long: number, lat: number, zoom = 11) => {
    viewRef.current?.goTo({ center: [long, lat], zoom }).catch(() => undefined)
  }

  if (!arcgisApiKey) {
    return (
      <main id='main-content' className='flex-1 p-6'>
        <Card>
          <CardContent className='flex flex-col items-center gap-2 py-16 text-center'>
            <AlertTriangle className='size-8 text-amber-500' />
            <p className='text-sm font-medium'>Carte ArcGIS indisponible</p>
            <p className='text-sm text-muted-foreground'>
              Renseigne VITE_ARCGIS_API_KEY dans le fichier .env pour activer la carte
              superposée ultra-détaillée.
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main
      id='main-content'
      className='flex h-[calc(100vh-3.5rem)] flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100 p-3 sm:p-4 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <div className='mb-3 flex items-center gap-2'>
        <Layers className='size-5 text-primary' />
        <h1 className='text-xl font-bold tracking-tight'>Carte superposée ultra-détaillée</h1>
        <Badge variant='outline' className='gap-1'>
          <Radio className='size-3 text-emerald-500' /> SUPER_ADMIN
        </Badge>
      </div>

      <div className='grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[20rem_1fr]'>
        <ScrollArea className='surface-card p-3'>
          <div className='space-y-4'>
            <section>
              <h2 className='mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                Couches
              </h2>
              <div className='space-y-1'>
                {(
                  [
                    ['sites', 'Sites & dépôts', MapPin],
                    ['trucks', 'Camions (GPS)', TruckIcon],
                    ['supply', 'Flux approvisionnement', Route],
                    ['checkpoints', 'Checkpoints livraison', MapPin],
                    ['heatmap', 'Heatmap densité', Flame],
                    ['zones', 'Zones (couverture/interdites)', Layers],
                  ] as [LayerKey, string, React.ComponentType<{ className?: string }>][]
                ).map(([key, label, Icon]) => (
                  <label
                    key={key}
                    className='flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-muted/60'
                  >
                    <span className='flex items-center gap-2 text-sm'>
                      <Icon className='size-4 text-muted-foreground' />
                      {label}
                    </span>
                    <Switch
                      checked={layers[key]}
                      onCheckedChange={(v) => setLayers((p) => ({ ...p, [key]: v }))}
                    />
                  </label>
                ))}
              </div>
            </section>

            <Separator />

            <section>
              <h2 className='mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                Légende sites
              </h2>
              <div className='grid grid-cols-1 gap-1 text-xs'>
                {(Object.keys(siteColors) as SiteType[]).map((t) => (
                  <div key={t} className='flex items-center gap-2'>
                    <span
                      className='size-3 rounded-full'
                      style={{ backgroundColor: `rgba(${siteColors[t].join(',')})` }}
                    />
                    {siteTypeLabels[t]}
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            <section>
              <h2 className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
                <AlertTriangle className='size-3.5 text-rose-500' /> Alertes ({alerts.length})
              </h2>
              <div className='space-y-1'>
                {alerts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => goTo(a.target[0], a.target[1])}
                    className='flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-rose-500/10'
                  >
                    <AlertTriangle className='size-3.5 shrink-0 text-rose-500' />
                    {a.title}
                  </button>
                ))}
                {alerts.length === 0 && (
                  <p className='px-2 text-xs text-muted-foreground'>Aucune alerte active.</p>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>

        <div
          className={cn(
            'relative min-h-[420px] overflow-hidden rounded-2xl border bg-muted',
            mapTheme === 'dark' ? 'calcite-mode-dark' : 'calcite-mode-light'
          )}
        >
          <div ref={mapContainerRef} className='absolute inset-0' />

          <div className='pointer-events-none absolute top-3 right-3 flex flex-wrap justify-end gap-2'>
            <Badge className='border-transparent bg-background/90 text-foreground shadow-sm backdrop-blur'>
              {sites.length} sites
            </Badge>
            <Badge variant='outline' className='border-transparent bg-background/90 shadow-sm backdrop-blur'>
              {trucks.length} camions
            </Badge>
            <Badge variant='outline' className='border-transparent bg-background/90 shadow-sm backdrop-blur'>
              {trips.length} tournées
            </Badge>
          </div>

          {!isReady && !loadFailed ? (
            <div className='pointer-events-none absolute inset-0 flex items-center justify-center bg-background/40 text-sm text-muted-foreground backdrop-blur-[1px]'>
              Chargement de la carte ArcGIS...
            </div>
          ) : null}

          {loadFailed ? (
            <div className='absolute inset-x-4 top-14 rounded-lg bg-background/95 px-3 py-2 text-sm text-amber-700 shadow-sm backdrop-blur dark:text-amber-300'>
              La carte n’a pas pu charger. Vérifie la clé API et les restrictions de domaine.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}

function buildHeatLayer(points: { latitude: number; longitude: number }[]) {
  const heatGraphics = points.map(
    (p, i) =>
      new Graphic({
        geometry: new Point({
          longitude: p.longitude,
          latitude: p.latitude,
          spatialReference: { wkid: 4326 },
        }),
        attributes: { OBJECTID: i + 1, weight: 1 },
      })
  )
  return new FeatureLayer({
    source: heatGraphics,
    objectIdField: 'OBJECTID',
    fields: [{ name: 'OBJECTID', type: 'oid' }, { name: 'weight', type: 'double' }],
    renderer: {
      type: 'heatmap',
      colorStops: [
        { ratio: 0, color: 'rgba(0, 255, 200, 0)' },
        { ratio: 0.2, color: 'rgba(0, 255, 200, 0.6)' },
        { ratio: 0.5, color: 'rgba(255, 255, 0, 0.8)' },
        { ratio: 0.8, color: 'rgba(255, 128, 0, 0.9)' },
        { ratio: 1, color: 'rgba(255, 0, 0, 1)' },
      ],
      field: 'weight',
    },
    visible: false,
  })
}

function createSiteGraphic(site: Site, mapTheme: MapTheme) {
  const color = siteColors[site.type]
  const outline = mapTheme === 'dark' ? [226, 232, 240, 0.84] : [15, 23, 42, 0.28]
  return new Graphic({
    geometry: new Point({ longitude: site.longitude, latitude: site.latitude, spatialReference: { wkid: 4326 } }),
    symbol: {
      type: 'simple-marker',
      style: site.type === 'marketer' || site.type === 'delivery-point' ? 'triangle' : 'circle',
      color,
      size: 12,
      outline: { color: outline as [number, number, number, number], width: 1.5 },
    },
    attributes: { kind: 'site', siteId: site.id, siteType: site.type },
    popupTemplate: {
      title: site.name,
      content: `<div><p><strong>Type</strong> ${siteTypeLabels[site.type]}</p><p><strong>Opérateur</strong> ${site.operator}</p><p><strong>Ville</strong> ${site.city}</p><p><strong>Région</strong> ${site.region}</p><p><strong>Statut</strong> ${siteStatusLabels[site.status]}</p></div>`,
    },
  })
}

function createTruckGraphic(truck: Truck, mapTheme: MapTheme) {
  const color = truckColors[truck.status]
  const telemetry = getTruckTelemetry(truck.id)
  const outline = mapTheme === 'dark' ? [248, 250, 252, 1] : [15, 23, 42, 0.28]
  return new Graphic({
    geometry: new Point({ longitude: truck.longitude, latitude: truck.latitude, spatialReference: { wkid: 4326 } }),
    symbol: { type: 'simple-marker', style: 'circle', color, size: 11, outline: { color: outline as [number, number, number, number], width: 1.5 } },
    attributes: { kind: 'truck', truckId: truck.id },
    popupTemplate: {
      title: `${truck.id} — ${truck.plateNumber}`,
      content: `<div><p><strong>Chauffeur</strong> ${truck.assignedDriver}</p><p><strong>Statut</strong> ${statusLabels[truck.status]}</p><p><strong>Position</strong> ${truck.currentLocation}</p><p><strong>Niveau GPL</strong> ${telemetry.lpgLevelPercent}%</p></div>`,
    },
  })
}

function createRouteGraphic(
  origin: Site,
  destination: Site,
  mapTheme: MapTheme
) {
  return new Graphic({
    geometry: new Polyline({
      paths: [[[origin.longitude, origin.latitude], [destination.longitude, destination.latitude]]],
      spatialReference: { wkid: 4326 },
    }),
    symbol: {
      type: 'simple-line',
      color: mapTheme === 'dark' ? [250, 204, 21, 0.9] : [217, 119, 6, 0.85],
      width: 3,
      style: 'short-dash',
    },
    attributes: { kind: 'route' },
  })
}

function createCheckpointGraphic(
  site: Site,
  title: string,
  role: string,
  mapTheme: MapTheme
) {
  const color: [number, number, number, number] =
    role === 'delivery' ? [14, 165, 233, 0.95] : [100, 116, 139, 0.9]
  const outline = mapTheme === 'dark' ? [226, 232, 240, 0.84] : [15, 23, 42, 0.28]
  return new Graphic({
    geometry: new Point({ longitude: site.longitude, latitude: site.latitude, spatialReference: { wkid: 4326 } }),
    symbol: { type: 'simple-marker', style: 'square', color, size: 8, outline: { color: outline, width: 1 } },
    attributes: { kind: 'checkpoint' },
    popupTemplate: { title, content: `<p><strong>Client</strong> ${site.name}</p><p><strong>Rôle</strong> ${role}</p>` },
  })
}

function createZoneGraphic(
  zone: { id: string; name: string; kind: 'coverage' | 'interdit'; ring: number[][][] }
) {
  const isCoverage = zone.kind === 'coverage'
  const fill: [number, number, number, number] = isCoverage ? [34, 197, 94, 0.18] : [239, 68, 68, 0.18]
  const line: [number, number, number, number] = isCoverage ? [34, 197, 94, 0.8] : [239, 68, 68, 0.8]
  return new Graphic({
    geometry: new Polygon({ rings: zone.ring, spatialReference: { wkid: 4326 } }),
    symbol: {
      type: 'simple-fill',
      color: fill,
      outline: { color: line, width: 2, style: isCoverage ? 'solid' : 'dash' },
    },
    attributes: { kind: 'zone' },
    popupTemplate: { title: zone.name, content: `<p>Type : ${isCoverage ? 'Couverture' : 'Interdite'}</p>` },
  })
}

// ---- static data accessors (local copies to avoid re-import churn) ----
function truckById(id: string) {
  return TRUCKS.find((t) => t.id === id)
}
