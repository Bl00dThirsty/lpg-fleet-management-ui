import { useEffect, useMemo, useRef, useState } from 'react'
import Graphic from '@arcgis/core/Graphic.js'
import ArcGISMap from '@arcgis/core/Map.js'
import '@arcgis/core/assets/esri/themes/light/main.css'
import '@arcgis/core/assets/esri/themes/dark/main.css'
import esriConfig from '@arcgis/core/config.js'
import Point from '@arcgis/core/geometry/Point.js'
import Polyline from '@arcgis/core/geometry/Polyline.js'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer.js'
import GroupLayer from '@arcgis/core/layers/GroupLayer.js'
import HeatmapRenderer from '@arcgis/core/renderers/HeatmapRenderer.js'
import MapView from '@arcgis/core/views/MapView.js'
import Legend from '@arcgis/core/widgets/Legend.js'
import {
  CAMEROON_CENTER,
  CAMEROON_COUNTRY_PORTAL_ITEM_ID,
  CAMEROON_REGION_PORTAL_ITEM_ID,
} from '@/features/map/lib/cameroon-boundaries'
import type { ClickEvent } from '@arcgis/core/views/input/types.js'
import { AlertTriangle, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { NationalMapView } from '@/features/map/data/national-map'
import { getPeriodRange } from '@/features/map/data/national-map'
import type { TourPeriod } from '@/features/map/data/national-map'
import {
  BOUNDARY_TOKENS,
  HEATMAP_DEFAULTS,
  MAP_DEFAULTS,
  TRUCK_STATUS_COLORS,
  getArcgisBasemap,
  getArcgisViewTheme,
  getMarkerOutlineColor,
} from '@/features/map/utils/map-theme'
import type { MapTheme } from '@/features/map/utils/map-theme'
import { LegendSiteIcon } from '@/features/map/utils/legend'
import { formatTm } from '@/features/map/utils/format'
import {
  getInitialLayers,
  LAYER_LABELS,
  type MapLayerKey,
} from '@/features/map/lib/layers'
import {
  buildClientSitePopupContent,
  buildRegionPopupContent,
  buildAnomalyPopupContent,
} from '@/features/map/utils/popup'
import {
  createSiteGraphics,
  createSitePopupContent as buildSitePopupContent,
  popupLine,
} from '@/features/sites/utils/site-graphics'
import { siteTypeLabels } from '@/features/sites/data/sites'
import type { SiteStatus, SiteType } from '@/features/sites/data/sites'
import type { Site } from '@/features/sites/data/sites'
import {
  getTruckTelemetry,
  statusLabels,
  type Truck,
  type TruckStatus,
} from '@/features/trucks/data/trucks'
import { quantityInfo } from '@/features/trucks/lib/quantity'
import type { RouteTripView } from '@/features/tours/data/tour-activity'
import type { UserScope } from '@/features/scope/scope'
import { getNationalMapView } from '@/features/map/data/national-map'
import { organizations } from '@lpg/mock-data'
import lpgImageUrl from '@/assets/lpg.png'

const arcgisApiKey = String(import.meta.env.VITE_ARCGIS_API_KEY ?? '').trim()

if (arcgisApiKey) {
  esriConfig.apiKey = arcgisApiKey
}

const truckStatusColors: Record<TruckStatus, [number, number, number, number]> =
  TRUCK_STATUS_COLORS as unknown as Record<TruckStatus, [number, number, number, number]>

const activeRouteStatuses = ['planned', 'in-progress', 'incident'] as const

export type BasemapMode = 'vector' | 'satellite'

export type MapEntitySelection =
  | { kind: 'site'; id: string; title: string; type: SiteType; status: SiteStatus }
  | { kind: 'client-site'; id: string; title: string }
  | { kind: 'truck'; id: string; title: string; plate: string; status: TruckStatus }
  | { kind: 'anomaly'; id: string; title: string; severity: string }
  | { kind: 'region'; id: string; title: string }
  | { kind: 'checkpoint'; id: string; title: string; tourId: string; sequence: number }

export type NationalMapProps = {
  mapTheme?: MapTheme
  className?: string
  focusZone?: string
  focusSite?: string
  layers?: Record<MapLayerKey, boolean>
  basemap?: BasemapMode
  scope?: UserScope
  /** Bumped to force a data refresh + full re-render of the graphics. */
  refreshToken?: number
  onEntitySelect?: (entity: MapEntitySelection) => void
  onViewReady?: (view: MapView) => void
  entityFilter?: 'all' | 'marketeur' | 'transporteur' | 'client'
  selectedOrgIds?: string[]
  tourPeriod?: TourPeriod
  tourCustomRange?: { from: string; to: string } | undefined
}

export function NationalMap({
  mapTheme = 'light',
  className,
  focusZone,
  focusSite,
  layers = getInitialLayers(),
  basemap = 'vector',
  scope,
  refreshToken = 0,
  onEntitySelect,
  onViewReady,
  entityFilter = 'all',
  selectedOrgIds = [],
  tourPeriod = 'today',
  tourCustomRange,
}: NationalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<ArcGISMap | null>(null)
  const viewRef = useRef<MapView | null>(null)
  const layersRef = useRef<Record<string, GraphicsLayer>>({})
  const focusLayerRef = useRef<GraphicsLayer | null>(null)
  const heatmapLayerRef = useRef<FeatureLayer | null>(null)
  const countryBoundaryLayerRef = useRef<FeatureLayer | null>(null)
  const regionBoundaryLayerRef = useRef<FeatureLayer | null>(null)
  const legendRef = useRef<Legend | null>(null)
  const initialMapThemeRef = useRef(mapTheme)
  const onEntitySelectRef = useRef(onEntitySelect)
  const onViewReadyRef = useRef(onViewReady)
  const [isReady, setIsReady] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [zoom, setZoom] = useState<number>(MAP_DEFAULTS.DEFAULT_ZOOM)
  const data = useMemo(() => getNationalMapView(scope), [scope, refreshToken])
  const dataRef = useRef(data)

  // GPS: initial point at user's position (like Google Maps My Location) — fallback to Cameroon center
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.longitude, position.coords.latitude])
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: MAP_DEFAULTS.GPS_TIMEOUT_MS, maximumAge: MAP_DEFAULTS.GPS_MAX_AGE_MS }
    )
  }, [])

  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    onEntitySelectRef.current = onEntitySelect
  }, [onEntitySelect])

  useEffect(() => {
    onViewReadyRef.current = onViewReady
  }, [onViewReady])

  useEffect(() => {
    if (!arcgisApiKey || !mapContainerRef.current) return

    const perLayer: Record<string, GraphicsLayer> = {}
    const initialToggles = getInitialLayers()
    for (const key of Object.keys(initialToggles) as MapLayerKey[]) {
      if (key === 'heatmap' || key === 'zoneBoundaries' || key === 'countryBoundaries') continue
      perLayer[key] = new GraphicsLayer({ title: LAYER_LABELS[key] })
    }
    layersRef.current = perLayer

    const heatmapLayer = new FeatureLayer({
      title: LAYER_LABELS.heatmap,
      objectIdField: 'ObjectID',
      geometryType: 'point',
      spatialReference: { wkid: 4326 },
      fields: [
        { name: 'ObjectID', alias: 'ObjectID', type: 'oid' },
        { name: 'weight', alias: 'weight', type: 'integer' },
      ],
      source: [],
      renderer: new HeatmapRenderer({
        colorStops: [...HEATMAP_DEFAULTS.colorStops] as unknown as never,
        radius: HEATMAP_DEFAULTS.radius,
        maxPixelIntensity: HEATMAP_DEFAULTS.maxPixelIntensity,
        minPixelIntensity: HEATMAP_DEFAULTS.minPixelIntensity,
      } as unknown as never),
      opacity: HEATMAP_DEFAULTS.opacity,
      visible: initialToggles.heatmap,
    })
    heatmapLayerRef.current = heatmapLayer

    // Dual boundaries: Country (outline) + Region (filled, selectable)
    const countryBoundaryLayer = new FeatureLayer({
      title: LAYER_LABELS.countryBoundaries,
      portalItem: { id: CAMEROON_COUNTRY_PORTAL_ITEM_ID } as unknown as never,
      outFields: ['*'],
      popupEnabled: false,
      popupTemplate: undefined as unknown as never,
      renderer: {
        type: 'simple',
        symbol: {
          type: 'simple-fill',
          color: [...BOUNDARY_TOKENS.country.fill] as unknown as never,
          outline: { color: [...BOUNDARY_TOKENS.country.outline] as unknown as never, width: BOUNDARY_TOKENS.country.outlineWidth },
        },
      } as unknown as never,
      opacity: BOUNDARY_TOKENS.country.opacity,
      visible: initialToggles.countryBoundaries,
    } as unknown as FeatureLayer)
    countryBoundaryLayerRef.current = countryBoundaryLayer

    const regionBoundaryLayer = new FeatureLayer({
      title: LAYER_LABELS.zoneBoundaries,
      portalItem: { id: CAMEROON_REGION_PORTAL_ITEM_ID } as unknown as never,
      outFields: ['*'],
      popupEnabled: false,
      popupTemplate: undefined as unknown as never,
      renderer: {
        type: 'simple',
        symbol: {
          type: 'simple-fill',
          color: [...BOUNDARY_TOKENS.region.fill] as unknown as never,
          outline: { color: [...BOUNDARY_TOKENS.region.outline] as unknown as never, width: BOUNDARY_TOKENS.region.outlineWidth },
        },
      } as unknown as never,
      opacity: BOUNDARY_TOKENS.region.opacity,
      visible: initialToggles.zoneBoundaries,
    } as unknown as FeatureLayer)
    regionBoundaryLayerRef.current = regionBoundaryLayer

    const boundariesGroup = new GroupLayer({
      title: 'Limites administratives',
      layers: [countryBoundaryLayer, regionBoundaryLayer],
      visibilityMode: 'independent',
      visible: true,
    } as unknown as never)

    const map = new ArcGISMap({
      basemap: getArcgisBasemap(initialMapThemeRef.current),
      layers: [...Object.values(perLayer), boundariesGroup, heatmapLayer],
    })
    const focusLayer = new GraphicsLayer({ title: 'Zone sélectionnée' })
    map.add(focusLayer)
    focusLayerRef.current = focusLayer

    const view = new MapView({
      container: mapContainerRef.current,
      map,
      center: [...CAMEROON_CENTER] as unknown as never,
      constraints: { minZoom: MAP_DEFAULTS.MIN_ZOOM },
      popup: { dockEnabled: false },
      theme: getArcgisViewTheme(initialMapThemeRef.current),
      zoom: MAP_DEFAULTS.DEFAULT_ZOOM,
    })

    const handle = view.on('click', async (event: ClickEvent) => {
      const response = await view.hitTest(event)
      const result = response.results?.[0] as
        | { graphic?: (typeof Graphic)['prototype'] }
        | undefined
      const graphic = result?.graphic as Graphic | undefined
      if (!graphic) return

      const kind = (graphic.attributes as Record<string, unknown>)?.kind as string | undefined
      if (kind === 'site-cluster' || kind === 'site-cluster-label') {
        const geom = graphic.geometry as Point
        await view.goTo({ center: [geom.longitude, geom.latitude], zoom: Math.min((view.zoom ?? 7) + 2, 14) } as unknown as never).catch(() => undefined)
        return
      }

      const entity = selectionFromGraphic(graphic, dataRef.current)
      if (entity) onEntitySelectRef.current?.(entity)

      if (graphic.popupTemplate?.content && graphic.geometry) {
        await view.openPopup({
          features: [graphic],
          location: graphic.geometry as Point,
        })
      }
    })

    const zoomHandle = view.watch('zoom', (z: number) => setZoom(z))
    view
      .when()
      .then(() => {
        setZoom(view.zoom)
        setLoadFailed(false)
        setIsReady(true)
        onViewReadyRef.current?.(view)

        // Proper legend management — native ArcGIS Legend widget, modular and auto-updates with layer visibility
        try {
          const legend = new Legend({ view, style: 'card' as unknown as never } as unknown as never)
          view.ui.add(legend as unknown as never, 'bottom-left')
          legendRef.current = legend as unknown as Legend
        } catch {
          // Legend is non-critical; map remains operational without it
        }

        // GPS: if user allowed, animate to their position like Google Maps My Location
        if (userLocation) {
          void view.goTo({ center: userLocation, zoom: MAP_DEFAULTS.GPS_ZOOM - 1 } as unknown as never).catch(() => undefined)
        } else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const center: [number, number] = [pos.coords.longitude, pos.coords.latitude]
              setUserLocation(center)
              void view.goTo({ center, zoom: MAP_DEFAULTS.GPS_ZOOM - 1 } as unknown as never).catch(() => undefined)
            },
            () => undefined,
            { enableHighAccuracy: false, timeout: MAP_DEFAULTS.GPS_TIMEOUT_MS }
          )
        }
      })
      .catch((err: unknown) => {
        if (err && (err as { name?: string }).name === 'AbortError') return
        setLoadFailed(true)
      })

    mapRef.current = map
    viewRef.current = view

    return () => {
      handle.remove()
      zoomHandle.remove()
      try {
        if (legendRef.current) {
          view.ui.remove(legendRef.current as unknown as never)
          legendRef.current = null
        }
      } catch {
        // ignore
      }
      view.destroy()
      focusLayer.removeAll()
      map.remove(focusLayer)
      focusLayerRef.current = null
      countryBoundaryLayerRef.current = null
      regionBoundaryLayerRef.current = null
      heatmapLayerRef.current = null
      mapRef.current = null
      viewRef.current = null
      setIsReady(false)
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const view = viewRef.current
    if (!isReady || !map || !view) return
    map.basemap =
      basemap === 'satellite'
        ? 'satellite'
        : getArcgisBasemap(mapTheme)
  }, [isReady, mapTheme, basemap])

  useEffect(() => {
    const view = viewRef.current
    if (!isReady || !view) return
    view.theme = getArcgisViewTheme(mapTheme)
  }, [isReady, mapTheme])

  useEffect(() => {
    const layers = layersRef.current
    if (!isReady || !data) return

    const hasOrgSelection = selectedOrgIds.length > 0
    // Parse org×region ids (orgId::region) with fallback to legacy orgId
    const parsed = selectedOrgIds.map((raw) => {
      const [orgId, region] = raw.split('::')
      return { raw, orgId: orgId ?? raw, region: region ?? '' }
    })
    const orgSet = new Set(parsed.map((p) => p.orgId))
    const orgNameSet = new Set(
      parsed
        .map((p) => organizations.find((o) => o.id === p.orgId)?.name)
        .filter((name): name is string => Boolean(name))
    )
    const regionSet = new Set(parsed.map((p) => p.region).filter(Boolean))
    const hasRegionFilter = regionSet.size > 0 && !regionSet.has('—')

    const filterByEntity = () => {
      if (hasOrgSelection) return { showSites: true, showClientSites: true, showTrucks: true }
      if (entityFilter === 'marketeur') return { showSites: true, showClientSites: false, showTrucks: false }
      if (entityFilter === 'transporteur') return { showSites: false, showClientSites: false, showTrucks: true }
      if (entityFilter === 'client') return { showSites: false, showClientSites: true, showTrucks: false }
      return { showSites: true, showClientSites: true, showTrucks: true }
    }
    const entityVisibility = filterByEntity()

    // Sites: match org + region (org×region semantics)
    const filteredSites = hasOrgSelection
      ? data.sites.filter((s) => {
          const orgMatch = orgNameSet.has(s.operator)
          if (!orgMatch) return false
          if (hasRegionFilter) return regionSet.has(s.region)
          return true
        })
      : data.sites
    const filteredClientSites = hasOrgSelection
      ? data.clientSites.filter((cs) => {
          const orgMatch = orgSet.has(cs.client_org_id) || (cs.current_marketeur_org_id ? orgSet.has(cs.current_marketeur_org_id) : false) || orgNameSet.has(cs.clientName)
          if (!orgMatch) return false
          if (hasRegionFilter) return regionSet.has(cs.region)
          return true
        })
      : data.clientSites
    const filteredTrucks = hasOrgSelection
      ? data.trucks.filter((t) => orgSet.has(t.org_id) || orgNameSet.has(t.tenant_name))
      : data.trucks
    // Period-aware routes: default today, influenced by tourPeriod
    const periodRange = getPeriodRange(tourPeriod, tourCustomRange)
    const periodFrom = periodRange.from.getTime()
    const periodTo = periodRange.to.getTime()
    const byPeriod = (r: RouteTripView) => {
      const iso = r.startedAt || r.lastUpdatedAt || ''
      if (!iso) return false
      const ms = new Date(iso).getTime()
      return ms >= periodFrom && ms < periodTo
    }
    const periodRoutes = data.routes.filter(byPeriod)
    const filteredRoutesBase = hasOrgSelection
      ? periodRoutes.filter(
          (r) =>
            orgSet.has((r.truck as unknown as { org_id?: string }).org_id as string) ||
            orgNameSet.has(r.truck.tenant_name) ||
            orgNameSet.has(r.originSite.operator) ||
            orgNameSet.has(r.destinationSite.operator),
        )
      : periodRoutes
    const filteredRoutes = filteredRoutesBase
    const filteredCheckpoints = hasOrgSelection
      ? data.checkpoints.filter((cp) => filteredRoutes.some((r) => r.id === cp.tournee_id))
      : data.checkpoints.filter((cp) => filteredRoutes.some((r) => r.id === cp.tournee_id))
    const filteredAnomalies = hasOrgSelection
      ? data.anomalies.filter((a) => (a.entity_id && orgSet.has(a.entity_id)) || orgSet.has(a.entity_label ?? ''))
      : data.anomalies

    const shouldCluster = zoom <= 7.5
    const siteGraphics = entityVisibility.showSites
      ? shouldCluster
        ? buildSiteClusterGraphics(filteredSites, mapTheme)
        : filteredSites.flatMap((s) => createSiteGraphics(s, mapTheme))
      : []
    const clientGraphics = entityVisibility.showClientSites
      ? filteredClientSites.map((cs) => {
          const pt = new Point({
            longitude: cs.longitude,
            latitude: cs.latitude,
            spatialReference: { wkid: 4326 },
          })
          return new Graphic({
            geometry: pt,
            symbol: {
              type: 'picture-marker',
              url: lpgImageUrl,
              width: 22,
              height: 22,
            },
            attributes: { kind: 'client-site', clientSiteId: cs.id },
            popupTemplate: {
              title: cs.name,
              content: buildClientSitePopupContent(cs, mapTheme),
            },
          })
        })
      : []
    const anomalyGraphics = (hasOrgSelection ? filteredAnomalies : data.anomalies).map((a) =>
      new Graphic({
        geometry: new Point({
          longitude: a.longitude,
          latitude: a.latitude,
          spatialReference: { wkid: 4326 },
        }),
        symbol: {
          type: 'simple-marker',
          style: 'circle',
          color: [239, 68, 68],
          size: 18,
          outline: {
            color: [239, 68, 68, 0.9],
            width: 2,
          },
        },
        attributes: { kind: 'anomaly', anomalyId: a.id },
        popupTemplate: {
          title: a.type,
          content: buildAnomalyPopupContent(a, mapTheme),
        },
      }),
    )
    // Checkpoints filtered by period + org selection
    const checkpointGraphics = filteredCheckpoints
      .map((checkpoint) => createCheckpointGraphic(checkpoint, mapTheme))
      .filter((graphic): graphic is Graphic => Boolean(graphic))

    const truckGraphics = entityVisibility.showTrucks
      ? (hasOrgSelection ? filteredTrucks : data.trucks).map((truck) => createTruckGraphic(truck, mapTheme))
      : []
    const routeGraphics = entityVisibility.showTrucks
      ? (hasOrgSelection ? filteredRoutes : data.routes)
          .filter((trip) =>
            activeRouteStatuses.includes(
              trip.status as (typeof activeRouteStatuses)[number]
            )
          )
          .flatMap((trip) => createRouteGraphics(trip, mapTheme))
      : []

    // Heatmap native ArcGIS FeatureLayer source update (density of anomalies + sites — filtered when org selected)
    const heatmapLayer = heatmapLayerRef.current
    if (heatmapLayer) {
      const heatmapSourceAnomalies = hasOrgSelection ? filteredAnomalies : data.anomalies
      const heatmapSourceSites = hasOrgSelection ? filteredSites : data.sites
      const heatmapPoints: Graphic[] = [
        ...heatmapSourceAnomalies.map(
          (a) =>
            new Graphic({
              geometry: new Point({
                longitude: a.longitude,
                latitude: a.latitude,
                spatialReference: { wkid: 4326 },
              }),
              attributes: { ObjectID: Number(a.id.replace(/\D/g, '').slice(0, 8) || Math.random() * 1e8), weight: 3 },
            })
        ),
        ...heatmapSourceSites.map(
          (s) =>
            new Graphic({
              geometry: new Point({
                longitude: s.longitude,
                latitude: s.latitude,
                spatialReference: { wkid: 4326 },
              }),
              attributes: { ObjectID: Math.floor(Math.random() * 1e9), weight: 1 },
            })
        ),
      ]
      heatmapLayer.source = heatmapPoints as unknown as never
    }

    layers.sites?.removeAll()
    layers.clientSites?.removeAll()
    layers.anomalies?.removeAll()
    layers.trucks?.removeAll()
    layers.checkpoints?.removeAll()

    layers.sites?.addMany(siteGraphics)
    layers.clientSites?.addMany(clientGraphics)
    layers.anomalies?.addMany(anomalyGraphics)
    layers.trucks?.addMany([...routeGraphics, ...truckGraphics])
    layers.checkpoints?.addMany(checkpointGraphics)
  }, [isReady, mapTheme, data, entityFilter, focusZone, selectedOrgIds, tourPeriod, tourCustomRange, zoom])

  useEffect(() => {
    const perLayer = layersRef.current
    if (!isReady) return
    for (const key of Object.keys(layers) as MapLayerKey[]) {
      if (key === 'heatmap') {
        const heatmapLayer = heatmapLayerRef.current
        if (heatmapLayer) heatmapLayer.visible = layers[key]
        continue
      }
      if (key === 'zoneBoundaries') {
        const regionLayer = regionBoundaryLayerRef.current
        if (regionLayer) (regionLayer as unknown as { visible: boolean }).visible = layers[key]
        continue
      }
      if (key === 'countryBoundaries') {
        const countryLayer = countryBoundaryLayerRef.current
        if (countryLayer) (countryLayer as unknown as { visible: boolean }).visible = layers[key]
        continue
      }
      const layer = perLayer[key]
      if (layer) layer.visible = layers[key]
    }
  }, [isReady, layers])

  // Modular GPS follow: when user location resolves after view is ready, recenter like Google Maps
  useEffect(() => {
    if (!isReady || !userLocation) return
    const view = viewRef.current
    if (!view) return
    void view.goTo({ center: userLocation, zoom: MAP_DEFAULTS.GPS_ZOOM } as unknown as never).catch(() => undefined)
  }, [isReady, userLocation])

  useEffect(() => {
    const view = viewRef.current
    const focusLayer = focusLayerRef.current
    const regionBoundaryLayer = regionBoundaryLayerRef.current
    if (!isReady || !data || !view || !focusLayer) return

    let active = true
    focusLayer.removeAll()

    // Enterprise: zone param highlights only that region limit via Region FeatureLayer
    if (focusZone && regionBoundaryLayer) {
      const layer = regionBoundaryLayer as unknown as { definitionExpression?: string; queryExtent: (q: unknown) => Promise<{ extent: unknown }> }
      const expression = `CODE = '${focusZone}'`
      try {
        layer.definitionExpression = expression
      } catch {
        // ignore
      }
      void layer
        .queryExtent({ where: expression } as unknown as never)
        .then((result: { extent: unknown }) => {
          if (!active || !result.extent) return
          void view.goTo(result.extent as unknown as never).catch(() => undefined)
        })
        .catch(() => {
          const fallbackRegion = data.regions.find((candidate) => candidate.code === focusZone)
          if (fallbackRegion) {
            void view.goTo({ center: [fallbackRegion.longitude, fallbackRegion.latitude], zoom: MAP_DEFAULTS.GPS_ZOOM - 2 } as unknown as never).catch(() => undefined)
          }
        })
      return () => {
        active = false
        if (regionBoundaryLayer) {
          try {
            ;(regionBoundaryLayer as unknown as { definitionExpression?: string }).definitionExpression = undefined
          } catch {
            // ignore
          }
        }
      }
    } else if (regionBoundaryLayer) {
      try {
        ;(regionBoundaryLayer as unknown as { definitionExpression?: string }).definitionExpression = undefined
      } catch {
        // ignore
      }
    }

    const region = data.regions.find((candidate) => candidate.code === focusZone)
    const site = focusSite
      ? data.sites.find((candidate) => candidate.id === focusSite)
      : undefined
    const clientSite = focusSite && !site
      ? data.clientSites.find((candidate) => candidate.id === focusSite)
      : undefined
    const focused = site ?? clientSite

    const focusPoint =
      focused && focused.latitude && focused.longitude
        ? { lng: focused.longitude, lat: focused.latitude }
        : region
          ? { lng: region.longitude, lat: region.latitude }
          : null

    if (!focusPoint) {
      return () => {
        active = false
        focusLayer.removeAll()
      }
    }

    const focusGraphic = new Graphic({
      geometry: new Point({
        longitude: focusPoint.lng,
        latitude: focusPoint.lat,
        spatialReference: { wkid: 4326 },
      }),
      symbol: {
        type: 'simple-marker',
        style: 'circle',
        color: [245, 158, 11, 0.3],
        size: 42,
        outline: {
          color: [245, 158, 11, 1],
          width: 3,
        },
      },
      attributes: {
        kind: site ? 'focused-site' : clientSite ? 'focused-client-site' : 'focused-region',
        ...(focused ? { siteId: focused.id } : { regionCode: region?.code }),
      },
      popupTemplate: site
        ? {
            title: site.name,
            content: buildSitePopupContent(site, mapTheme),
          }
        : clientSite
          ? {
              title: clientSite.name,
              content: buildClientSitePopupContent(clientSite, mapTheme),
            }
          : region
            ? {
                title: region.name,
                content: buildRegionPopupContent(region, mapTheme),
              }
            : undefined,
    })
    if (!active) return
    focusLayer.add(focusGraphic)

    const navigation = view.goTo({
      center: [focusPoint.lng, focusPoint.lat],
      zoom: focused ? MAP_DEFAULTS.FOCUS_SITE_ZOOM : MAP_DEFAULTS.FOCUS_REGION_ZOOM,
    }) as Promise<void> & { cancel?: () => void }
    void navigation.catch(() => undefined)

    return () => {
      active = false
      navigation.cancel?.()
      focusLayer.remove(focusGraphic)
    }
  }, [data, focusSite, focusZone, isReady, mapTheme])

  if (!arcgisApiKey) {
    return (
      <div
        className={cn(
          'flex min-h-[560px] items-center justify-center bg-muted/30 p-6 text-center md:min-h-[620px]',
          className,
        )}
      >
        <div className="max-w-sm space-y-2">
          <AlertTriangle className="mx-auto size-8 text-amber-500" />
          <p className="text-sm font-medium">ArcGIS</p>
          <p className="text-sm text-muted-foreground">
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
        'national-arcgis-map relative min-h-[560px] overflow-hidden bg-muted md:min-h-[620px]',
        mapTheme === 'dark' ? 'calcite-mode-dark' : 'calcite-mode-light',
        className,
      )}
      data-map-theme={mapTheme}
      role='img'
      aria-label='Carte nationale du réseau GPL'
    >
      <div
        ref={mapContainerRef}
        className="absolute inset-0 h-full min-h-[560px] w-full md:min-h-[620px]"
      />

      <div className="pointer-events-none absolute top-4 right-16 flex flex-wrap items-center justify-end gap-2">
        <Badge className="gap-1 border-transparent bg-background/90 text-foreground shadow-sm backdrop-blur">
          <Wifi className="size-3 text-emerald-500" />
          ArcGIS
        </Badge>
        {data?.sites.length ? (
          <Badge
            variant="outline"
            className="border-transparent bg-background/90 shadow-sm backdrop-blur"
          >
            {data.sites.length} sites
          </Badge>
        ) : null}
        {data?.clientSites.length ? (
          <Badge
            variant="outline"
            className="border-transparent bg-background/90 shadow-sm backdrop-blur"
          >
            {data.clientSites.length} clients
          </Badge>
        ) : null}
        {data?.trucks.length ? (
          <Badge
            variant="outline"
            className="border-transparent bg-background/90 shadow-sm backdrop-blur"
          >
            {data.trucks.length} véhicules
          </Badge>
        ) : null}
        {data?.anomalies.length ? (
          <Badge
            variant="outline"
            className="border-transparent bg-background/90 shadow-sm backdrop-blur"
          >
            {data.anomalies.length} anomalies
          </Badge>
        ) : null}
        {data ? (
          <Badge
            variant="outline"
            className="border-transparent bg-background/90 shadow-sm backdrop-blur"
          >
            {formatTm(data.vrac.totalTM)}
          </Badge>
        ) : null}
      </div>

      {!isReady && !loadFailed ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/40 text-sm text-muted-foreground backdrop-blur-[1px]">
          Chargement de la carte ArcGIS...
        </div>
      ) : null}

      {data && data.sites.length > 0 ? (
        <div className="pointer-events-none absolute right-4 bottom-20 max-w-[240px] rounded-2xl bg-background/70 p-3 text-xs shadow-sm backdrop-blur-md">
          <p className="font-medium text-foreground/90">Réseau logistique</p>
          <div className="mt-2 space-y-2">
            {Object.entries(
              data.sites.reduce(
                (acc, s) => {
                  acc[s.type] = (acc[s.type] ?? 0) + 1
                  return acc
                },
                {} as Record<string, number>,
              ),
            )
              .filter(([, count]) => count > 0)
              .map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <span className="shrink-0">
                      <LegendSiteIcon type={type as SiteType} mapTheme={mapTheme} />
                    </span>
                    {type}
                  </span>
                  <span className="font-medium text-foreground">{count}</span>
                </div>
              ))}
          </div>
        </div>
      ) : null}

      {loadFailed ? (
        <div className="absolute inset-x-4 top-16 rounded-lg bg-background/95 px-3 py-2 text-sm text-amber-700 shadow-sm backdrop-blur dark:text-amber-300">
          La carte ArcGIS n'a pas pu charger. Vérifie la clé API et les
          restrictions de domaine.
        </div>
      ) : null}
    </div>
  )
}

function createTruckGraphic(truck: Truck, mapTheme: MapTheme) {
  const telemetry = getTruckTelemetry(truck.id)
  const color = truckStatusColors[truck.tournee_status]
  const outlineColor = getMarkerOutlineColor(mapTheme, false)

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
      size: 11,
      outline: {
        color: outlineColor,
        width: 1.5,
      },
    },
    attributes: {
      kind: 'truck',
      truckId: truck.id,
      status: truck.tournee_status,
    },
    popupTemplate: {
      title: `${truck.license_plate} - ${truck.tenant_name}`,
      content: buildTruckPopupContent(truck, telemetry, mapTheme),
    },
  })
}

function createRouteGraphics(trip: RouteTripView, _mapTheme: MapTheme) {
  const origin = trip.originSite
  const destination = trip.destinationSite
  if (
    !origin.latitude ||
    !origin.longitude ||
    !destination.latitude ||
    !destination.longitude
  ) {
    return []
  }

  const path: [number, number][] = [
    [origin.longitude, origin.latitude],
    [destination.longitude, destination.latitude],
  ]

  return [
    new Graphic({
      geometry: new Polyline({
        paths: [path],
        spatialReference: { wkid: 4326 },
      }),
      symbol: {
        type: 'simple-line',
        color:
          trip.status === 'incident' ? [239, 68, 68, 0.9] : [14, 165, 233, 0.85],
        width: 3,
        style: trip.status === 'incident' ? 'short-dash' : 'solid',
      },
      attributes: { kind: 'route', tourId: trip.id, status: trip.status },
      popupTemplate: {
        title: trip.reference,
        content: buildRoutePopupContent(trip),
      },
    }),
  ]
}

function createCheckpointGraphic(
  checkpoint: { id: string; tournee_id: string; sequence: number; status: string; latitude: number | null; longitude: number | null; tourReference: string },
  mapTheme: MapTheme
) {
  if (checkpoint.latitude === null || checkpoint.longitude === null) return null as unknown as Graphic
  const statusColor: Record<string, [number, number, number, number]> = {
    COMPLETED: [16, 185, 129, 0.95],
    REACHED: [14, 165, 233, 0.95],
    PENDING: [100, 116, 139, 0.85],
    SKIPPED: [245, 158, 11, 0.95],
  }
  const color = statusColor[checkpoint.status] ?? [100, 116, 139, 0.9]
  return new Graphic({
    geometry: new Point({
      longitude: checkpoint.longitude!,
      latitude: checkpoint.latitude!,
      spatialReference: { wkid: 4326 },
    }),
    symbol: {
      type: 'simple-marker',
      style: 'circle',
      color,
      size: 10,
      outline: { color: getMarkerOutlineColor(mapTheme, false), width: 1.2 },
    },
    attributes: {
      kind: 'checkpoint',
      checkpointId: checkpoint.id,
      tourId: checkpoint.tournee_id,
      sequence: checkpoint.sequence,
    },
    popupTemplate: {
      title: `Point #${checkpoint.sequence} — ${checkpoint.tourReference}`,
      content: `
        <div class="fleet-truck-popup" data-popup-theme="${mapTheme}">
          ${popupLine('Tournée', checkpoint.tourReference)}
          ${popupLine('Séquence', String(checkpoint.sequence))}
          ${popupLine('Statut', checkpoint.status)}
        </div>
      `,
    },
  })
}

function buildSiteClusterGraphics(sites: readonly Site[], mapTheme: MapTheme): Graphic[] {
  if (sites.length === 0) return []
  const grid = new Map<string, Site[]>()
  for (const s of sites) {
    const key = `${Math.round(s.longitude * 2) / 2}_${Math.round(s.latitude * 2) / 2}`
    const arr = grid.get(key) ?? []
    arr.push(s)
    grid.set(key, arr)
  }
  const graphics: Graphic[] = []
  for (const bucket of grid.values()) {
    if (bucket.length === 1) {
      graphics.push(...createSiteGraphics(bucket[0]!, mapTheme))
      continue
    }
    const lng = bucket.reduce((sum, s) => sum + s.longitude, 0) / bucket.length
    const lat = bucket.reduce((sum, s) => sum + s.latitude, 0) / bucket.length
    const counts = bucket.reduce(
      (acc, s) => {
        // count primary for cluster total, then each secondary role separately
        acc[s.type] = (acc[s.type] ?? 0) + 1
        for (const t of s.allTypes) {
          if (t !== s.type) acc[t] = (acc[t] ?? 0) + 1
        }
        return acc
      },
      {} as Record<SiteType, number>,
    )
    const total = bucket.length
    const multiCount = bucket.filter((s) => s.allTypes.length > 1).length
    const size = Math.min(44, 30 + Math.log2(total) * 8)
    const lines = (Object.entries(counts) as [SiteType, number][])
      .filter(([, n]) => n > 0)
      .map(([t, n]) => popupLine(siteTypeLabels[t], String(n)))
      .join('')
    const multiLine = multiCount > 0 ? popupLine('Sites multi-rôles', `${multiCount} (+ badge)`) : ''
    const breakdown = (lines || popupLine('Sites', String(total))) + multiLine
    graphics.push(
      new Graphic({
        geometry: new Point({ longitude: lng, latitude: lat, spatialReference: { wkid: 4326 } }),
        symbol: {
          type: 'simple-marker',
          style: 'circle',
          color: [99, 102, 241, 0.92],
          size,
          outline: { color: getMarkerOutlineColor(mapTheme, false), width: 1.6 },
        },
        attributes: { kind: 'site-cluster', count: total, gridKey: `${lng}_${lat}` },
        popupTemplate: {
          title: `Groupe ${total} sites`,
          content: `<div class="fleet-truck-popup" data-popup-theme="${mapTheme}">${breakdown}${popupLine('Zoomer', 'Cliquez pour détailler')}</div>`,
        },
      }),
      new Graphic({
        geometry: new Point({ longitude: lng, latitude: lat, spatialReference: { wkid: 4326 } }),
        symbol: {
          type: 'text',
          text: String(total),
          color: [255, 255, 255, 1],
          haloColor: [15, 23, 42, 0.8],
          haloSize: 1,
          font: { size: 11, weight: 'bold', family: 'Inter' },
        } as unknown as never,
        attributes: { kind: 'site-cluster-label', count: total },
      }),
    )
  }
  return graphics
}

function buildTruckPopupContent(
  truck: Truck,
  telemetry: ReturnType<typeof getTruckTelemetry>,
  mapTheme: MapTheme,
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

function buildRoutePopupContent(trip: RouteTripView) {
  const origin = trip.originSite.name
  const destination = trip.destinationSite.name
  const unit = (trip.truck as unknown as { type?: string }).type === 'VRAC' ? 'TM' : 'btl'
  return `
    <div class="fleet-truck-popup" data-popup-theme="light">
      ${popupLine('Référence', trip.reference)}
      ${popupLine('Itinéraire', `${origin} -> ${destination}`)}
      ${popupLine('Chargé', `${trip.loadedQuantity} ${unit}`)}
      ${popupLine('Livré', `${trip.deliveredQuantity} ${unit}`)}
      ${popupLine('Restant', `${trip.remainingQuantity} ${unit}`)}
    </div>
  `
}

function selectionFromGraphic(
  graphic: Graphic,
  data: NationalMapView,
): MapEntitySelection | null {
  const attributes = graphic.attributes ?? {}
  const kind = attributes.kind as string

  switch (kind) {
    case 'site': {
      const site = data.sites.find((s) => s.id === attributes.siteId)
      return {
        kind: 'site',
        id: attributes.siteId as string,
        title: site?.name ?? (graphic.popupTemplate?.title as string) ?? 'Site',
        type: (attributes.siteType as SiteType) ?? site?.type ?? 'depot',
        status: site?.status ?? 'active',
      }
    }
    case 'client-site': {
      const client = data.clientSites.find((c) => c.id === attributes.clientSiteId)
      return {
        kind: 'client-site',
        id: attributes.clientSiteId as string,
        title: client?.name ?? (graphic.popupTemplate?.title as string) ?? 'Site client',
      }
    }
    case 'truck': {
      const truck = data.trucks.find((t) => t.id === attributes.truckId)
      return {
        kind: 'truck',
        id: attributes.truckId as string,
        title:
          truck
            ? `${truck.license_plate} - ${truck.tenant_name}`
            : (graphic.popupTemplate?.title as string) ?? 'Véhicule',
        plate: truck?.license_plate ?? '',
        status: (attributes.status as TruckStatus) ?? truck?.tournee_status ?? 'PLANNED',
      }
    }
    case 'anomaly': {
      const anomaly = data.anomalies.find((a) => a.id === attributes.anomalyId)
      return {
        kind: 'anomaly',
        id: attributes.anomalyId as string,
        title: anomaly?.type ?? (graphic.popupTemplate?.title as string) ?? 'Anomalie',
        severity: anomaly?.severity ?? '',
      }
    }
    case 'region': {
      const region = data.regions.find((r) => r.code === attributes.regionCode)
      return {
        kind: 'region',
        id: attributes.regionCode as string,
        title: region?.name ?? (graphic.popupTemplate?.title as string) ?? 'Région',
      }
    }
    case 'checkpoint': {
      return {
        kind: 'checkpoint',
        id: attributes.checkpointId as string,
        title: (graphic.popupTemplate?.title as string) ?? 'Point de contrôle',
        tourId: attributes.tourId as string,
        sequence: Number(attributes.sequence ?? 0),
      }
    }
    case 'site-cluster':
    case 'site-cluster-label':
    case 'site-badge':
      return null
    default:
      return null
  }
}