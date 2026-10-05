import { useEffect, useRef, useState, useMemo } from 'react'
import Graphic from '@arcgis/core/Graphic.js'
import ArcGISMap from '@arcgis/core/Map.js'
import '@arcgis/core/assets/esri/themes/light/main.css'
import esriConfig from '@arcgis/core/config.js'
import Point from '@arcgis/core/geometry/Point.js'
import Polyline from '@arcgis/core/geometry/Polyline.js'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js'
import MapView from '@arcgis/core/views/MapView.js'
import type { ClickEvent } from '@arcgis/core/views/input/types.js'

import { useSitesStore } from '@/store/sites-store'
import { useClientSitesStore } from '@/store/client-sites-store'
import { useVehiclesStore } from '@/store/vehicles-store'
import { useRegionsStore } from '@/store/regions-store'
import { useAnomaliesStore } from '@/store/anomalies-store'
import { useAuthStore } from '@/store/auth-store'

import { getSites } from '@/features/sites/data/sites'
import { getClientSitesView } from '@/features/map/data/client-sites'
import { getTrucks } from '@/features/trucks/data/trucks'
import { aggregateVracVolume } from '@/features/map/lib/vrac-volume'
import { regionsForMap } from '@/features/map/lib/regions'
import { getGeoAnomalies } from '@/features/map/data/geo-anomalies'
import { type VracTourRoute } from '@/features/map/data/itineraries'
import {
  DEFAULT_MAP_SITES,
  DEFAULT_MAP_CLIENT_SITES,
  DEFAULT_MAP_ANOMALIES,
  DEFAULT_MAP_VRAC_SUMMARY,
  CAMEROON_REGIONS_SEEDED,
} from '@/features/map/data/map-seed'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { getNationalMapView, type NationalMapView } from '@/features/map/data/national-map'
import {
  getArcgisBasemap,
  getArcgisViewTheme,
  getMarkerOutlineColor,
  rgbaFromTuple,
} from '@/features/map/utils/map-theme'
import type { MapTheme } from '@/features/map/utils/map-theme'
import { formatTm } from '@/features/map/utils/format'
import { getInitialLayers, type MapLayerKey } from '@/features/map/lib/layers'
import {
  buildClientSitePopupContent,
  buildRegionPopupContent,
  buildAnomalyPopupContent,
  buildRoutePopupContent,
} from '@/features/map/utils/popup'
import { createSiteGraphics } from '@/features/sites/utils/site-graphics'
import lpgImageUrl from '@/assets/lpg.png'


import { createRobustBasemap } from '@/features/map/utils/robust-basemap'

const rawApiKey = String(import.meta.env.VITE_ARCGIS_API_KEY ?? '')
  .trim()
  .replace(/^["']|["']$/g, '')
if (rawApiKey && rawApiKey.length > 20) {
  esriConfig.apiKey = rawApiKey
}

const CAMEROON_CENTER: [number, number] = [9.7, 4.05] // Centré sur l'axe Douala / Wouri

export type NationalMapProps = {
  routes: VracTourRoute[]
  mapTheme?: MapTheme
  className?: string
  layers?: Record<MapLayerKey, boolean>
  focusedRoute?: VracTourRoute | null
  onFocusRoute?: (route: VracTourRoute) => void
}

export function NationalMap({
  routes,
  mapTheme = 'light',
  className,
  layers: externalLayers,
  focusedRoute,
  onFocusRoute: _onFocusRoute,
}: NationalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<ArcGISMap | null>(null)
  const viewRef = useRef<MapView | null>(null)
  const layersRef = useRef<Record<string, GraphicsLayer>>({})
  const [isReady, setIsReady] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  const activeLayers = useMemo(
    () => externalLayers ?? getInitialLayers(),
    [externalLayers],
  )

  const { sites: sitesEntities, fetchSites } = useSitesStore()
  const { clientSites: clientSitesEntities, fetchClientSites } = useClientSitesStore()
  const { vehicles, fetchVehicles } = useVehiclesStore()
  const { regions, fetchRegions } = useRegionsStore()
  const { anomalies, fetchAnomalies } = useAnomaliesStore()

  useEffect(() => {
    fetchSites()
    fetchClientSites()
    fetchVehicles()
    fetchRegions()
    fetchAnomalies()
  }, [])

  const authUser = useAuthStore((s) => s.user)

  // Hydratation réactive : données d'API si reçues, sinon graine réaliste Cameroun
  const data = useMemo<NationalMapView>(() => {
    const liveSites = sitesEntities.length > 0 ? getSites(sitesEntities) : DEFAULT_MAP_SITES
    const liveClients =
      clientSitesEntities.length > 0
        ? getClientSitesView(clientSitesEntities)
        : DEFAULT_MAP_CLIENT_SITES
    const liveVrac =
      vehicles.length > 0
        ? aggregateVracVolume(getTrucks(vehicles))
        : DEFAULT_MAP_VRAC_SUMMARY
    const liveRegions =
      regions.length > 0 ? regionsForMap(regions) : CAMEROON_REGIONS_SEEDED
    const liveAnomalies =
      anomalies.length > 0
        ? getGeoAnomalies(anomalies, sitesEntities, clientSitesEntities)
        : DEFAULT_MAP_ANOMALIES

    const isRegulator = !authUser || ['SUPERADMIN', 'ADMIN', 'SUPERVISOR', 'INTEGRATEUR'].includes(authUser.system_role)
    const scopedSites = (!isRegulator && authUser?.org_id)
      ? liveSites.filter((s) => s.orgId === authUser.org_id)
      : liveSites
    const scopedClients = (!isRegulator && authUser?.org_id)
      ? liveClients.filter((cs) => cs.current_marketeur_org_id === authUser.org_id || cs.client_org_id === authUser.org_id)
      : liveClients

    return getNationalMapView({
      sites: scopedSites,
      clientSites: scopedClients,
      vrac: liveVrac,
      regions: liveRegions,
      anomalies: liveAnomalies,
      routes,
    })
  }, [sitesEntities, clientSitesEntities, vehicles, regions, anomalies, routes, authUser])

  // Initialisation ArcGIS
  useEffect(() => {
    if (!mapContainerRef.current) {
      setLoadFailed(true)
      return
    }

    const perLayer: Record<string, GraphicsLayer> = {
      sites: new GraphicsLayer({ title: 'LPG sites' }),
      clientSites: new GraphicsLayer({ title: 'LPG clientSites' }),
      zones: new GraphicsLayer({ title: 'LPG zones' }),
      regions: new GraphicsLayer({ title: 'LPG regions' }),
      anomalies: new GraphicsLayer({ title: 'LPG anomalies' }),
      routes: new GraphicsLayer({ title: 'LPG routes' }),
    }
    layersRef.current = perLayer

    const initialBasemap = rawApiKey ? getArcgisBasemap(mapTheme) : createRobustBasemap(mapTheme)

    const map = new ArcGISMap({
      basemap: initialBasemap,
      layers: Object.values(perLayer),
    })

    // Auto-fallback: si le fond de carte échoue à charger les tuiles, basculer sur OSM/CartoDB
    map.basemap?.load?.().catch(() => {
      map.basemap = createRobustBasemap(mapTheme)
    })

    const view = new MapView({
      container: mapContainerRef.current,
      map,
      center: CAMEROON_CENTER,
      constraints: { minZoom: 4 },
      popup: { dockEnabled: false },
      theme: getArcgisViewTheme(mapTheme),
      zoom: 12,
    })

    const handle = view.on('click', async (event: ClickEvent) => {
      const response = await view.hitTest(event)
      const result = response.results?.[0] as
        | { graphic?: (typeof Graphic)['prototype'] }
        | undefined
      const graphic = result?.graphic as Graphic | undefined
      if (graphic?.popupTemplate?.content && graphic.geometry) {
        await view.openPopup({
          features: [graphic],
          location: graphic.geometry as Point,
        })
      }
    })

    view
      .when(() => {
        setLoadFailed(false)
        setIsReady(true)
      })
      .catch((err: unknown) => {
        if (err && (err as { name?: string }).name === 'AbortError') return
        console.warn('MapView load event warning, switching to robust basemap:', err)
        map.basemap = createRobustBasemap(mapTheme)
        setLoadFailed(false)
        setIsReady(true)
      })

    mapRef.current = map
    viewRef.current = view

    return () => {
      handle.remove()
      view.destroy()
      mapRef.current = null
      viewRef.current = null
      setIsReady(false)
    }
  }, [])

  // Basemap & theme sync
  useEffect(() => {
    const map = mapRef.current
    const view = viewRef.current
    if (!map || !view) return
    const targetBasemap = rawApiKey ? getArcgisBasemap(mapTheme) : createRobustBasemap(mapTheme)
    map.basemap = targetBasemap
    map.basemap?.load?.().catch(() => {
      map.basemap = createRobustBasemap(mapTheme)
    })
    view.theme = getArcgisViewTheme(mapTheme)
  }, [mapTheme])

  // Visibilité des couches réactive aux bascules
  useEffect(() => {
    const layers = layersRef.current
    if (!isReady || !layers) return

    for (const [key, isVisible] of Object.entries(activeLayers)) {
      if (layers[key]) {
        layers[key].visible = isVisible
      }
    }
  }, [isReady, activeLayers])

  // Rendu des graphiques vectoriels sur ArcGIS
  useEffect(() => {
    const layers = layersRef.current
    if (!isReady || !data) return

    // 1. SITES MARCHANDS
    const siteGraphics = data.sites.flatMap((s) => createSiteGraphics(s, mapTheme))

    // 2. SITES CLIENTS
    const clientGraphics = data.clientSites.map((cs) => {
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
          width: 24,
          height: 24,
        },
        attributes: { kind: 'client-site', clientSiteId: cs.id },
        popupTemplate: {
          title: cs.name,
          content: buildClientSitePopupContent(cs, mapTheme),
        },
      })
    })

    // 3. RÉGIONS
    const regionGraphics = data.regions.map((r) =>
      new Graphic({
        geometry: new Point({
          longitude: r.longitude,
          latitude: r.latitude,
          spatialReference: { wkid: 4326 },
        }),
        symbol: {
          type: 'simple-marker',
          style: 'circle',
          color: rgbaFromTuple([60, 90, 200, 0.45]),
          size: 26,
          outline: {
            color: getMarkerOutlineColor(mapTheme, false),
            width: 1.5,
          },
        },
        attributes: { kind: 'region', regionCode: r.code },
        popupTemplate: {
          title: `Région ${r.name}`,
          content: buildRegionPopupContent(r, mapTheme),
        },
      }),
    )

    // 4. ANOMALIES GÉOGRAPHIQUES
    const anomalyGraphics = data.anomalies.map((a) =>
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
            color: [255, 255, 255, 0.95],
            width: 2,
          },
        },
        attributes: { kind: 'anomaly', anomalyId: a.id },
        popupTemplate: {
          title: `Alerte : ${a.type}`,
          content: buildAnomalyPopupContent(a, mapTheme),
        },
      }),
    )

    // 5. Itinéraires calculés sur le réseau routier ArcGIS
    const routeGraphics: Graphic[] = []
    for (const route of data.routes) {
      const resolvedPaths = (route.roadPaths && route.roadPaths.length > 0)
        ? route.roadPaths
        : (route.path && route.path.length > 0)
          ? [route.path]
          : []
      const line = new Polyline({
        paths: resolvedPaths,
        spatialReference: { wkid: 4326 },
      })

      if (resolvedPaths.length > 0) {
        // Gaine lumineuse externe
        routeGraphics.push(
          new Graphic({
            geometry: line,
            symbol: {
              type: 'simple-line',
              color: [245, 158, 11, 0.35],
              width: 8,
              cap: 'round',
              join: 'round',
            },
          }),
        )

        // Trait de route principal
        routeGraphics.push(
          new Graphic({
            geometry: line,
            symbol: {
              type: 'simple-line',
              color: [245, 158, 11, 0.95],
              width: 3.5,
              style: 'solid',
              cap: 'round',
              join: 'round',
            },
            attributes: { kind: 'vrac-route', tourCode: route.tourCode },
            popupTemplate: {
              title: `Tournée VRAC : ${route.tourCode}`,
              content: buildRoutePopupContent(route, mapTheme),
            },
          }),
        )

      }

      // Point départ
      routeGraphics.push(
        new Graphic({
          geometry: new Point({
            longitude: route.departureCoords[0],
            latitude: route.departureCoords[1],
            spatialReference: { wkid: 4326 },
          }),
          symbol: {
            type: 'simple-marker',
            style: 'circle',
            color: [16, 185, 129],
            size: 14,
            outline: { color: [255, 255, 255], width: 2 },
          },
          attributes: { kind: 'route-start', name: route.departureName },
          popupTemplate: {
            title: `Départ : ${route.departureName}`,
            content: `<b>Heure de départ :</b> ${route.startedAt}<br/><b>Opération :</b> Emplissage et pesée validés.`,
          },
        }),
      )

      // Point arrivée
      routeGraphics.push(
        new Graphic({
          geometry: new Point({
            longitude: route.destinationCoords[0],
            latitude: route.destinationCoords[1],
            spatialReference: { wkid: 4326 },
          }),
          symbol: {
            type: 'simple-marker',
            style: 'circle',
            color: [59, 130, 246],
            size: 14,
            outline: { color: [255, 255, 255], width: 2 },
          },
          attributes: { kind: 'route-end', name: route.destinationName },
          popupTemplate: {
            title: `Arrivée : ${route.destinationName}`,
            content: `<b>Heure estimée :</b> ${route.estimatedArrival}<br/><b>Volume :</b> ${formatTm(route.loadedQuantityTM)}`,
          },
        }),
      )

      // Camion en transit (position active sur le Pont du Wouri)
      routeGraphics.push(
        new Graphic({
          geometry: new Point({
            longitude: route.currentPosition[0],
            latitude: route.currentPosition[1],
            spatialReference: { wkid: 4326 },
          }),
          symbol: {
            type: 'simple-marker',
            style: 'diamond',
            color: [245, 158, 11],
            size: 16,
            outline: { color: [255, 255, 255], width: 2.5 },
          },
          attributes: { kind: 'active-truck', plate: route.vehiclePlate },
          popupTemplate: {
            title: `Citerne VRAC : ${route.vehiclePlate}`,
            content: `<b>Chauffeur :</b> ${route.driverName}<br/><b>Position :</b> Position simulée sur le trajet<br/><b>Volume :</b> ${formatTm(route.loadedQuantityTM)}<br/><b>Vitesse :</b> 38 km/h`,
          },
        }),
      )
    }

    // Réinitialisation et ajout des graphiques
    layers.sites?.removeAll()
    layers.clientSites?.removeAll()
    layers.regions?.removeAll()
    layers.anomalies?.removeAll()
    layers.routes?.removeAll()

    layers.sites?.addMany(siteGraphics)
    layers.clientSites?.addMany(clientGraphics)
    layers.regions?.addMany(regionGraphics)
    layers.anomalies?.addMany(anomalyGraphics)
    layers.routes?.addMany(routeGraphics)
  }, [isReady, mapTheme, data])

  // Zoom animé sur l'itinéraire sélectionné
  useEffect(() => {
    if (!focusedRoute || !isReady || !viewRef.current) return
    const resolvedRoute = routes.find((route) => route.id === focusedRoute.id) ?? focusedRoute
    const targetPaths = resolvedRoute.roadPaths ?? (resolvedRoute.path && resolvedRoute.path.length > 0 ? [resolvedRoute.path] : undefined)
    if (!targetPaths) return
    const view = viewRef.current
    const line = new Polyline({
      paths: targetPaths,
      spatialReference: { wkid: 4326 },
    })
    if (line.extent) {
      view.goTo({ target: line.extent.expand(1.35) }, { duration: 900 }).catch(() => {})
    }
  }, [focusedRoute, routes, isReady])

  // Fallback vectoriel GIS autonome si clé ArcGIS absente ou service injoignable
  if (loadFailed) {
    return (
      <div className={cn('flex min-h-[560px] items-center justify-center bg-muted p-6 text-center', className)} role='status'>
        Carte indisponible. Vérifiez la connexion et la configuration SIG pour afficher les routes réelles.
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
    >
      <div
        ref={mapContainerRef}
        className="absolute inset-0 h-full min-h-[560px] w-full md:min-h-[620px]"
      />

      {activeLayers.routes && (
        <div role='status' className='absolute bottom-4 left-4 rounded-(--radius) border border-border/40 bg-background/35 px-3 py-2 text-xs shadow-sm backdrop-blur-xl text-foreground font-medium'>
          Itinéraires routiers • Supervision VRAC en direct
        </div>
      )}
      {/* Top Floating Badges (Translucent Glassmorphism) */}
      <div className="pointer-events-none absolute top-4 right-4 sm:right-6 flex flex-wrap items-center justify-end gap-2">
        {data.sites.length > 0 && (
          <Badge
            variant="outline"
            className="border-border/40 bg-background/35 text-foreground shadow-sm backdrop-blur-xl font-medium text-xs"
          >
            {data.sites.length} sites
          </Badge>
        )}
        {data.clientSites.length > 0 && (
          <Badge
            variant="outline"
            className="border-border/40 bg-background/35 text-foreground shadow-sm backdrop-blur-xl font-medium text-xs"
          >
            {data.clientSites.length} clients
          </Badge>
        )}
        {data.routes.length > 0 && (
          <Badge
            variant="outline"
            className="border-amber-500/35 bg-amber-500/15 text-amber-800 dark:text-amber-300 shadow-sm backdrop-blur-xl font-medium text-xs"
          >
            {data.routes.length} tournée(s) VRAC
          </Badge>
        )}
        {data.anomalies.length > 0 && (
          <Badge
            variant="outline"
            className="border-red-500/35 bg-red-500/15 text-red-700 dark:text-red-400 shadow-sm backdrop-blur-xl font-medium text-xs"
          >
            {data.anomalies.length} alerte(s)
          </Badge>
        )}
        <Badge
          variant="outline"
          className="border-border/40 bg-background/35 text-foreground shadow-sm backdrop-blur-xl font-medium text-xs"
        >
          {formatTm(data.vrac.totalTM)}
        </Badge>
      </div>

      {!isReady && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/50 text-sm font-medium text-foreground backdrop-blur-[2px]">
          Chargement de la carte...
        </div>
      )}
    </div>
  )
}
