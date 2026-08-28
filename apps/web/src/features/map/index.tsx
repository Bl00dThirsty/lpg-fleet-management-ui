import { lazy, Suspense, useMemo, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import type MapView from '@arcgis/core/views/MapView.js'
import { MapIcon, Globe, Building2, Truck, Users, Route, Flag, Flame, X, CalendarRange } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'
import { useRoleStore } from '@/store/role-store'
import { useAuthStore } from '@/store/auth-store'
import { getScope } from '@/features/scope/scope'
import { ROLE_LABELS } from '@/config/rbac/roles'
import { siteTypeLabels } from '@/features/sites/data/sites'
import { getNationalMapView, type TourPeriod } from '@/features/map/data/national-map'
import { NationalMapFilters } from './components/national-map-filters'
import { NationalMapToolbar, type MapSearchItem } from './components/national-map-toolbar'
import { NationalMapDetails } from './components/national-map-details'
import { MapOrgSelector, getOrgDetails, parseOrgRegionId } from './components/map-org-selector'
import { getInitialLayers, type MapLayerKey } from './lib/layers'
import type { BasemapMode, MapEntitySelection } from './components/national-map'
import { DateRangePicker } from '@/components/date-range-picker'
import type { DateRange } from 'react-day-picker'
import lpgSphereUrl from '@/assets/lpg-sphere.png'

const NationalMap = lazy(() =>
  import('./components/national-map').then((m) => ({ default: m.NationalMap })),
)

const route = getRouteApi('/_authenticated/map/')

export function NationalMapPage() {
  const { zone, site } = route.useSearch()
  const { resolvedTheme } = useTheme()
  const activeRole = useRoleStore((s) => s.activeRole)
  const user = useAuthStore((s) => s.user)
  const scope = useMemo(() => getScope(user), [user])
  const mapTheme = resolvedTheme === 'dark' ? 'dark' : 'light'
  const [layers, setLayers] = useState<Record<MapLayerKey, boolean>>(
    getInitialLayers(),
  )
  const [basemap, setBasemap] = useState<BasemapMode>('vector')
  const [refreshToken, setRefreshToken] = useState(0)
  const [layersOpen, setLayersOpen] = useState(false)
  const [selected, setSelected] = useState<MapEntitySelection | null>(null)
  const [view, setView] = useState<MapView | null>(null)
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([])
  const [tourPeriod, setTourPeriod] = useState<TourPeriod>('today')
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined)

  const toggleLayer = (key: MapLayerKey, enabled: boolean) => {
    setLayers((prev) => ({ ...prev, [key]: enabled }))
  }

  const tourCustomRange = useMemo(() => {
    if (tourPeriod !== 'custom' || !customRange?.from) return undefined
    return { from: customRange.from.toISOString(), to: (customRange.to ?? customRange.from).toISOString() }
  }, [tourPeriod, customRange])

  const searchItems = useMemo<MapSearchItem[]>(() => {
    const view = getNationalMapView(scope)
    return [
      ...view.sites.map((s) => ({
        id: s.id,
        label: s.name,
        sublabel: `${siteTypeLabels[s.type]} · ${s.city}`,
        lat: s.latitude,
        lng: s.longitude,
      })),
      ...view.clientSites.map((cs) => ({
        id: cs.id,
        label: cs.name,
        sublabel: 'Site client',
        lat: cs.latitude,
        lng: cs.longitude,
      })),
    ].filter((item) => item.lat && item.lng)
  }, [scope])

  return (
    <main
      id="main-content"
      className="relative flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900"
    >
      <section className="rounded-2xl border-transparent bg-background/88 p-3 shadow-sm backdrop-blur-sm sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <MapIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Carte interactive</h1>
          <Badge variant="outline" className="ml-auto">
            {ROLE_LABELS[activeRole] ?? activeRole}
          </Badge>
        </div>
        {/* Operational layer toggles — Country + Region boundaries, period for tours */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground mr-1">Couches:</span>
          <Button
            type="button"
            variant={layers.zoneBoundaries ? 'default' : 'outline'}
            size="sm"
            className="h-8 rounded-full gap-1.5"
            onClick={() => toggleLayer('zoneBoundaries', !layers.zoneBoundaries)}
          >
            <MapIcon data-icon="inline-start" />
            Régions
          </Button>
          <Button
            type="button"
            variant={layers.countryBoundaries ? 'default' : 'outline'}
            size="sm"
            className="h-8 rounded-full gap-1.5"
            onClick={() => toggleLayer('countryBoundaries', !layers.countryBoundaries)}
          >
            <Globe data-icon="inline-start" />
            Pays
          </Button>
          <Button
            type="button"
            variant={layers.checkpoints ? 'default' : 'outline'}
            size="sm"
            className="h-8 rounded-full gap-1.5"
            onClick={() => toggleLayer('checkpoints', !layers.checkpoints)}
          >
            <Flag data-icon="inline-start" />
            Points de contrôle
          </Button>
          <Button
            type="button"
            variant={layers.heatmap ? 'default' : 'outline'}
            size="sm"
            className={cn('h-8 rounded-full gap-1.5', layers.heatmap && 'bg-orange-600 hover:bg-orange-700 text-white')}
            onClick={() => toggleLayer('heatmap', !layers.heatmap)}
          >
            <Flame data-icon="inline-start" />
            Heatmap
          </Button>
          <Button
            type="button"
            variant={layers.trucks ? 'default' : 'outline'}
            size="sm"
            className="h-8 rounded-full gap-1.5"
            onClick={() => toggleLayer('trucks', !layers.trucks)}
          >
            <Route data-icon="inline-start" />
            Tournées
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground inline-flex items-center gap-1 mr-1"><CalendarRange data-icon="inline-start" /> Période tournées:</span>
          {(['today', 'week', 'month', 'custom'] as const).map((p) => (
            <Button
              key={p}
              type="button"
              variant={tourPeriod === p ? 'default' : 'outline'}
              size="sm"
              className="h-7 rounded-full px-3 text-xs"
              onClick={() => setTourPeriod(p)}
            >
              {p === 'today' ? "Aujourd'hui" : p === 'week' ? '7 jours' : p === 'month' ? '30 jours' : 'Personnalisé'}
            </Button>
          ))}
          {tourPeriod === 'custom' ? (
            <DateRangePicker value={customRange} onValueChange={setCustomRange} className="h-8" />
          ) : null}
        </div>
        {zone ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-violet-500/10 border border-violet-500/20 px-3 py-2 text-xs">
            <span className="size-2 rounded-full bg-violet-600 animate-pulse" />
            <span className="font-medium">Zone: {zone}</span>
            <span className="text-muted-foreground">— affichage limites + zoom Étendue (comme Google Maps place/Yaoundé)</span>
          </div>
        ) : null}

        {/* Org×Région selector — full-width, sphere for DEPOT, groupé par région */}
        <div className="mt-4 rounded-xl border border-border/60 bg-card/50 p-3">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Sélection org × région — acronyme + site client uniquement</p>
          <p className="mt-1 text-xs text-muted-foreground">Chaque org est listé par région (ex. SCTM · Centre, SCTM · Littoral). DEPOT affiche la sphère GPL. La carte montre sites et sites clients + tournées de la période.</p>
          <div className="mt-3">
            <MapOrgSelector selectedIds={selectedOrgIds} onChange={setSelectedOrgIds} scope={scope} />
          </div>
        </div>

        {selectedOrgIds.length > 0 ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selectedOrgIds.map((id) => {
              const { orgId, region } = parseOrgRegionId(id)
              const org = getOrgDetails(orgId)
              if (!org) return null
              const isDepot = org.type === 'DEPOT'
              const Icon = org.type === 'MARKETEUR' ? Building2 : org.type === 'TRANSPORTEUR' ? Truck : Users
              return (
                <div key={id} className="rounded-xl border border-border/60 bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-muted overflow-hidden">
                        {isDepot ? <img src={lpgSphereUrl} alt="" className="size-6 object-contain" /> : <Icon className="size-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">{org.name}</p>
                        <div className="mt-1 flex gap-1">
                          <Badge variant="outline" className="text-[10px]">{org.type}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{region}</Badge>
                        </div>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => setSelectedOrgIds((prev) => prev.filter((v) => v !== id))}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/40 px-2 py-2">
                      <p className="text-sm font-semibold">{(org as unknown as { operational_site_count?: number }).operational_site_count ?? '—'}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Sites</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 px-2 py-2">
                      <p className="text-sm font-semibold">{(org as unknown as { vehicle_count?: number }).vehicle_count ?? '—'}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Véhicules</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 px-2 py-2">
                      <p className="text-sm font-semibold">{(org as unknown as { client_site_count?: number }).client_site_count ?? '—'}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Clients</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full rounded-lg text-xs"
                    onClick={() => {
                      const targetOrg = org
                      const sitesForOrg = getNationalMapView(scope).sites.filter((s) => s.operator === targetOrg.name && (region === '—' || s.region === region))
                      const first = sitesForOrg[0]
                      if (first && view) {
                        void view.goTo({ center: [first.longitude, first.latitude], zoom: 11 } as unknown as never).catch(() => undefined)
                      }
                    }}
                  >
                    <MapIcon className="size-3.5" /> Voir {region}
                  </Button>
                </div>
              )
            })}
          </div>
        ) : null}
      </section>

      <section className="relative rounded-xl border-transparent bg-background/92 p-4 shadow-sm">
        <Suspense
          fallback={
            <div
              className='flex h-[700px] w-full items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground'
              role='status'
              aria-label='Chargement de la carte'
            >
              Chargement de la carte…
            </div>
          }
        >
          <div className="relative">
            <NationalMap
              className='h-[700px] w-full rounded-lg'
              focusZone={zone}
              focusSite={site}
              layers={layers}
              mapTheme={mapTheme}
              basemap={basemap}
              scope={scope}
              refreshToken={refreshToken}
              selectedOrgIds={selectedOrgIds}
              tourPeriod={tourPeriod}
              tourCustomRange={tourCustomRange}
              onViewReady={(readyView) => {
                setView(readyView)
              }}
              onEntitySelect={(entity) => setSelected(entity)}
            />
            <NationalMapToolbar
              view={view}
              searchItems={searchItems}
              basemap={basemap}
              onBasemapChange={setBasemap}
              onRefresh={() => setRefreshToken((token) => token + 1)}
              onSearchPick={(item) => {
                void view
                  ?.goTo({ center: [item.lng, item.lat], zoom: 10 })
                  .catch(() => undefined)
              }}
              layersOpen={layersOpen}
              onLayersToggle={setLayersOpen}
            />
            {layersOpen ? (
              <NationalMapFilters
                layers={layers}
                mapTheme={mapTheme}
                onChange={toggleLayer}
              />
            ) : null}
            {selected ? (
              <NationalMapDetails
                entity={selected}
                onClose={() => setSelected(null)}
              />
            ) : null}
          </div>
        </Suspense>
      </section>

      <section className="rounded-xl border-transparent bg-background/92 p-3 text-xs text-muted-foreground shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Globe className="h-4 w-4" />
          Les données affichées proviennent du jeu de graine local
          ({'@lpg/mock-data'}). Les volumes VRAC sont exprimés en tonnes métriques
          (TM) — jamais en kg.
        </div>
      </section>
    </main>
  )
}