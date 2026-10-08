import { getScope } from '@/features/scope/scope'
import { useMemo, useState } from 'react'
import { Layers, Moon, Sun, Route, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { NationalMap } from './components/national-map'
import { NationalMapFilters } from './components/national-map-filters'
import { VracItineraryCard } from './components/vrac-itinerary-card'
import { MarketerSearch } from './components/marketer-search'
import { getInitialLayers, type MapLayerKey } from './lib/layers'
import { useVracRoadRoutes } from './data/road-routes'
import type { VracTourRoute } from './data/itineraries'
import {
  mapCoordinates,
  type MarketerMapEntry,
} from './data/marketer-directory'
import type { MapTheme } from './utils/map-theme'
export function NationalMapPage() {
  const user = useAuthStore((s) => s.user)
  const routes = useVracRoadRoutes()
  const [layers, setLayers] = useState(getInitialLayers)
  const [theme, setTheme] = useState<MapTheme>('light')
  const [showFilters, setShowFilters] = useState(false)
  const [showRoutes, setShowRoutes] = useState(false)
  const [marketer, setMarketer] = useState<MarketerMapEntry | null>(null)
  const [focusedRoute, setFocusedRoute] = useState<VracTourRoute | null>(null)
  const [focusedLocation, setFocusedLocation] = useState<
    [number, number] | null
  >(null)
  const visibleRoutes = useMemo(
    () =>
      routes.filter((route) => {
        const accessible =
          (user?.org_type === 'REGULATEUR' && getScope(user).view === 'org') ||
          route.marketerOrgId === user?.org_id
        return (
          accessible &&
          (!marketer || route.marketerOrgId === marketer.organization.id)
        )
      }),
    [routes, user, marketer]
  )
  const highlightedLocations = useMemo(
    () =>
      marketer
        ? [...marketer.locations, ...marketer.deliveries].flatMap((site) => {
            const coordinates = mapCoordinates(site.geo_point)
            return coordinates ? [{ id: site.id, coordinates }] : []
          })
        : [],
    [marketer]
  )
  const selectRoute = (route: VracTourRoute) => {
    setFocusedLocation(null)
    setFocusedRoute(route)
  }
  const focusPoint = (point: [number, number]) => {
    setFocusedRoute(null)
    setFocusedLocation([...point])
  }
  return (
    <main
      id='main-content'
      className='relative flex-1 overflow-hidden bg-muted'
    >
      <h1 className='sr-only'>Carte des marketeurs et des livraisons</h1>
      <NationalMap
        highlightedLocations={highlightedLocations}
        routes={visibleRoutes}
        layers={layers}
        mapTheme={theme}
        focusedRoute={focusedRoute}
        focusedLocation={focusedLocation}
        onFocusRoute={selectRoute}
        className='h-[calc(100dvh-4rem)] min-h-[640px] w-full'
      />
      <div className='absolute left-16 right-3 top-4 z-20 max-w-sm sm:left-20'>
        <MarketerSearch
          onFocus={focusPoint}
          onSelect={(entry) => {
            setMarketer(entry)
            setFocusedRoute(null)
            setFocusedLocation(
              entry?.coordinates ? [...entry.coordinates] : null
            )
          }}
        />
      </div>
      <div className='absolute bottom-14 left-4 z-20 flex flex-wrap gap-2'>
        <Button
          variant='outline'
          className='bg-background shadow-sm'
          aria-expanded={showFilters}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Layers className='mr-2 size-4' />
          Couches
        </Button>
        <Button
          variant='outline'
          className='bg-background shadow-sm'
          aria-label={
            theme === 'light'
              ? 'Activer le fond sombre'
              : 'Activer le fond clair'
          }
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? (
            <Moon className='size-4' />
          ) : (
            <Sun className='size-4' />
          )}
        </Button>
        <Button
          variant='outline'
          className='bg-background shadow-sm'
          aria-expanded={showRoutes}
          onClick={() => setShowRoutes(!showRoutes)}
        >
          <Route className='mr-2 size-4' />
          Tournées ({visibleRoutes.length})
        </Button>
      </div>
      {showFilters && (
        <div className='absolute bottom-28 left-4 z-30 max-h-[55dvh] overflow-auto rounded-lg border bg-background shadow-lg'>
          <NationalMapFilters
            layers={layers}
            mapTheme={theme}
            onChange={(key: MapLayerKey, enabled: boolean) =>
              setLayers((prev) => ({ ...prev, [key]: enabled }))
            }
            className='w-64'
          />
        </div>
      )}
      {showRoutes && (
        <div className='absolute bottom-28 right-3 z-30 max-h-[65dvh] w-[min(24rem,calc(100%-1.5rem))] overflow-auto rounded-lg border bg-background shadow-lg'>
          <div className='flex justify-end'>
            <Button
              variant='ghost'
              size='icon'
              aria-label='Fermer les tournées'
              onClick={() => setShowRoutes(false)}
            >
              <X className='size-4' />
            </Button>
          </div>
          <VracItineraryCard
            routes={visibleRoutes}
            selectedRouteCode={
              focusedRoute?.tourCode ?? visibleRoutes[0]?.tourCode ?? ''
            }
            onSelectRoute={(code) => {
              const route = visibleRoutes.find((r) => r.tourCode === code)
              if (route) selectRoute(route)
            }}
            onFocusRoute={selectRoute}
            onClose={() => setShowRoutes(false)}
          />
        </div>
      )}
    </main>
  )
}
