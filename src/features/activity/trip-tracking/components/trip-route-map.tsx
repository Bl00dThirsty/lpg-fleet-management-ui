import { useEffect, useRef, useState } from 'react'
import '@arcgis/core/assets/esri/themes/light/main.css'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import Graphic from '@arcgis/core/Graphic'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import * as route from '@arcgis/core/rest/route'
import RouteParameters from '@arcgis/core/rest/support/RouteParameters'
import FeatureSet from '@arcgis/core/rest/support/FeatureSet'
import Point from '@arcgis/core/geometry/Point'
import esriConfig from '@arcgis/core/config'
import { Loader2, Navigation } from 'lucide-react'
import type { ClickEvent } from '@arcgis/core/views/input/types'
import { useTheme } from '@/context/theme-provider'

import type { Trip } from '../data/trip-data'
import { sites } from '@/features/sites/data/sites'
import { createSiteGraphics, type MapTheme } from '@/features/sites/utils/site-graphics'
import { cn } from '@/lib/utils'

// Configure API Key (make sure it's defined in .env)
if (import.meta.env.VITE_ARCGIS_API_KEY) {
  esriConfig.apiKey = import.meta.env.VITE_ARCGIS_API_KEY
}

const routeUrl = 'https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World'

type TripRouteMapProps = {
  trip: Trip | null
}

export function TripRouteMap({ trip }: TripRouteMapProps) {
  const mapDiv = useRef<HTMLDivElement>(null)
  const viewRef = useRef<MapView | null>(null)
  const routeLayerRef = useRef<GraphicsLayer | null>(null)
  const sitesLayerRef = useRef<GraphicsLayer | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()
  const mapTheme: MapTheme = resolvedTheme === 'dark' ? 'dark' : 'light'

  // Initialize Map
  useEffect(() => {
    if (!mapDiv.current) return

    const routeLayer = new GraphicsLayer()
    const sitesLayer = new GraphicsLayer()
    routeLayerRef.current = routeLayer
    sitesLayerRef.current = sitesLayer

    const map = new Map({
      basemap: mapTheme === 'dark' ? 'streets-night-vector' : 'arcgis-navigation',
      layers: [sitesLayer, routeLayer],
    })

    const view = new MapView({
      container: mapDiv.current,
      map: map,
      center: [11.5167, 3.8667], // Default center (Yaoundé)
      zoom: 6,
      ui: { components: ['zoom'] }, // minimal UI
      popup: {
        dockEnabled: false,
      },
      theme: mapTheme === 'dark'
        ? { accentColor: '#86efac', textColor: '#f8fafc' }
        : { accentColor: '#16a34a', textColor: '#0f172a' },
    })

    // Handle clicks for popups on sites
    const clickHandle = view.on('click', async (event: ClickEvent) => {
      const response = await view.hitTest(event)
      const siteHit = response.results.find((r) => {
        const graphic = (r as { graphic?: Graphic }).graphic
        return graphic?.attributes?.kind === 'site'
      }) as { graphic?: Graphic } | undefined

      if (siteHit?.graphic) {
        await view.openPopup({
          features: [siteHit.graphic],
          location: siteHit.graphic.geometry as Point,
        })
      }
    })

    viewRef.current = view

    return () => {
      clickHandle.remove()
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
  }, [mapTheme])

  // Update sites on map
  useEffect(() => {
    const sitesLayer = sitesLayerRef.current
    if (!sitesLayer) return

    const siteGraphics = sites.flatMap((site) => createSiteGraphics(site, mapTheme))
    sitesLayer.removeAll()
    sitesLayer.addMany(siteGraphics)
  }, [mapTheme])

  // Update Route when trip changes
  useEffect(() => {
    if (!viewRef.current || !routeLayerRef.current || !trip) return

    const view = viewRef.current
    const routeLayer = routeLayerRef.current

    routeLayer.removeAll()
    setIsCalculating(true)
    setError(null)

    const originPoint = new Point({
      longitude: trip.origin.coordinates[0],
      latitude: trip.origin.coordinates[1],
    })

    const destinationPoint = new Point({
      longitude: trip.destination.coordinates[0],
      latitude: trip.destination.coordinates[1],
    })

    // Define marker styles
    const originSymbol = {
      type: 'simple-marker' as const,
      style: 'circle' as const,
      color: [255, 255, 255],
      size: '14px',
      outline: {
        color: [34, 197, 94], // green for origin
        width: 3,
      },
    }

    const destSymbol = {
      type: 'simple-marker' as const,
      style: 'circle' as const,
      color: [255, 255, 255],
      size: '14px',
      outline: {
        color: [59, 130, 246], // blue for destination
        width: 3,
      },
    }

    const originGraphic = new Graphic({
      geometry: originPoint,
      symbol: originSymbol,
      attributes: { Name: trip.origin.name, kind: 'trip-marker' },
    })

    const destinationGraphic = new Graphic({
      geometry: destinationPoint,
      symbol: destSymbol,
      attributes: { Name: trip.destination.name, kind: 'trip-marker' },
    })

    routeLayer.addMany([originGraphic, destinationGraphic])

    const routeParams = new RouteParameters({
      stops: new FeatureSet({
        features: [originGraphic, destinationGraphic],
      }),
      returnDirections: false,
      returnRoutes: true,
    })

    route
      .solve(routeUrl, routeParams)
      .then((data) => {
        if (data.routeResults && data.routeResults.length > 0) {
          const routeResult = data.routeResults[0].route
          if (routeResult) {
            routeResult.symbol = {
              type: 'simple-line',
              color: [59, 130, 246, 0.8], // blue line
              width: 4,
            } as any
            routeLayer.add(routeResult)

            // Zoom to route
            if (routeResult.geometry && routeResult.geometry.extent) {
              view.goTo({ target: routeResult.geometry.extent.expand(1.2) })
            }
          }
        }
      })
      .catch((err) => {
        console.error('Routing error:', err)
        setError("Impossible de calculer l'itinéraire exact.")
        // Still zoom to stops even if routing fails
        view.goTo({ target: [originGraphic, destinationGraphic] })
      })
      .finally(() => {
        setIsCalculating(false)
      })
  }, [trip])

  if (!trip) {
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
    <div
      className={cn(
        'fleet-arcgis-map relative h-full w-full min-h-[300px] overflow-hidden bg-slate-50',
        mapTheme === 'dark' ? 'calcite-mode-dark' : 'calcite-mode-light'
      )}
    >
      {/* Map Container */}
      <div ref={mapDiv} className='absolute inset-0 outline-none' />

      {/* Loading Overlay */}
      {isCalculating && (
        <div className='absolute inset-0 z-10 flex items-center justify-center bg-background/20 backdrop-blur-[2px] transition-all duration-300'>
          <div className='flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-medium shadow-md'>
            <Loader2 className='h-4 w-4 animate-spin text-primary' />
            Calcul de l'itinéraire optimal...
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !isCalculating && (
        <div className='absolute bottom-6 left-1/2 z-10 -translate-x-1/2'>
          <div className='rounded-full border border-destructive/20 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive shadow-md backdrop-blur-sm'>
            {error}
          </div>
        </div>
      )}
      
      {/* Map styling overrides to hide esri widgets if we want it fully clean */}
      <style>{`
        .esri-view .esri-view-surface:focus::after {
          outline: none !important;
        }
      `}</style>
    </div>
  )
}
