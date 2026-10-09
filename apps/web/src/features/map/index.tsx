import { useMemo, useState } from 'react'
import { Layers, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NationalMap } from './components/national-map'
import { NationalMapFilters } from './components/national-map-filters'
import { MarketerSearch } from './components/marketer-search'
import { MissionFilters } from './components/mission-filters'
import { getInitialLayers, type MapLayerKey } from './lib/layers'
import {
  EMPTY_MISSION_FILTERS,
  matchesMissionFilters,
  type MissionFilters as Filters,
} from './lib/mission-filters'
import { useMapMissions, useMissionRoadRoutes } from './data/map-missions'
import type { MarketerMapEntry } from './data/marketer-directory'
import type { MapTheme } from './utils/map-theme'
const NO_DEMO_ROUTES: [] = []
export function NationalMapPage() {
  const { missions, loading, error, retry } = useMapMissions()
  const [layers, setLayers] = useState(() => ({
    ...getInitialLayers(),
    sites: false,
    clientSites: false,
    regions: false,
    vrac: false,
  }))
  const [theme, setTheme] = useState<MapTheme>('light')
  const [showLayers, setShowLayers] = useState(false)
  const [marketer, setMarketer] = useState<MarketerMapEntry | null>(null)
  const [filters, setFilters] = useState<Filters>(EMPTY_MISSION_FILTERS)
  const [selectedId, setSelectedId] = useState('ALL')
  const [focusedLocation, setFocusedLocation] = useState<
    [number, number] | null
  >(null)
  const filtered = useMemo(
    () =>
      missions.filter((mission) =>
        matchesMissionFilters(
          mission.tour,
          marketer?.organization.id ?? null,
          filters
        )
      ),
    [missions, marketer, filters]
  )
  const effectiveId = filtered.some((mission) => mission.tour.id === selectedId)
    ? selectedId
    : 'ALL'
  const visible = useMemo(
    () =>
      filtered.filter(
        (mission) => effectiveId === 'ALL' || mission.tour.id === effectiveId
      ),
    [filtered, effectiveId]
  )
  const routes = useMissionRoadRoutes(error ? [] : visible)
  const highlightedLocations = useMemo(
    () =>
      focusedLocation
        ? [{ id: 'focused-site', coordinates: focusedLocation }]
        : [],
    [focusedLocation]
  )
  const updateFilters = (value: Filters) => {
    setFilters(value)
    setSelectedId('ALL')
    setFocusedLocation(null)
  }
  return (
    <main
      id='main-content'
      className='relative flex-1 overflow-hidden bg-muted'
    >
      <h1 className='sr-only'>Carte des tournées et des marketeurs</h1>
      <NationalMap
        routes={NO_DEMO_ROUTES}
        missionRoutes={routes}
        highlightedLocations={highlightedLocations}
        focusedLocation={focusedLocation}
        layers={layers}
        mapTheme={theme}
        className='h-[calc(100dvh-4rem)] min-h-[640px] w-full'
      />
      <div className='absolute left-16 right-3 top-4 z-20 max-w-sm sm:left-20'>
        <MarketerSearch
          onFocus={(point) => setFocusedLocation([...point])}
          onSelect={(entry) => {
            setMarketer(entry)
            setSelectedId('ALL')
            setFocusedLocation(null)
          }}
        >
          <MissionFilters
            filters={filters}
            onChange={updateFilters}
            missions={filtered}
            selectedId={effectiveId}
            onSelect={(id) => {
              setSelectedId(id)
              setFocusedLocation(null)
            }}
            loading={loading}
            error={error}
            retry={retry}
          />
        </MarketerSearch>
      </div>
      <div className='absolute bottom-14 left-4 z-20 flex gap-2'>
        <Button
          variant='outline'
          className='bg-background shadow-sm'
          aria-expanded={showLayers}
          onClick={() => setShowLayers(!showLayers)}
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
      </div>
      {showLayers && (
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
    </main>
  )
}
