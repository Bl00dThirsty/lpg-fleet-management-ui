import { useState, useMemo } from 'react'
import { useAuthStore } from '@/store/auth-store'
import {
  MapIcon,
  Globe,
  Truck,
  Building2,
  MapPin,
  AlertTriangle,
  Layers,
  Sun,
  Moon,
  Navigation,
  Radio,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NationalMap } from './components/national-map'
import { NationalMapFilters } from './components/national-map-filters'
import { VracItineraryCard } from './components/vrac-itinerary-card'
import { getInitialLayers, type MapLayerKey } from './lib/layers'
import { type VracTourRoute } from './data/itineraries'
import { useVracRoadRoutes } from './data/road-routes'
import type { MapTheme } from './utils/map-theme'
import { formatTm } from './utils/format'

export function NationalMapPage() {
  const [layers, setLayers] = useState<Record<MapLayerKey, boolean>>(getInitialLayers())
  const [mapTheme, setMapTheme] = useState<MapTheme>('light')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedRouteCode, setSelectedRouteCode] = useState<string>('TR-VRAC-DLA-001')
  const userRole = useAuthStore((s) => s.user?.system_role) ?? 'CSPH'

  const routes = useVracRoadRoutes()
  const currentRoute = useMemo(
    () => routes.find((r) => r.tourCode === selectedRouteCode) ?? routes[0] ?? null,
    [routes, selectedRouteCode],
  )
  const [focusedRoute, setFocusedRoute] = useState<VracTourRoute | null>(currentRoute)

  const toggleLayer = (key: MapLayerKey, enabled: boolean) => {
    setLayers((prev) => ({ ...prev, [key]: enabled }))
  }

  const handleSelectRoute = (code: string) => {
    setSelectedRouteCode(code)
    const match = routes.find((r) => r.tourCode === code) ?? null
    setFocusedRoute(match)
  }

  const handleFocusRoute = (route: VracTourRoute) => {
    setSelectedRouteCode(route.tourCode)
    setFocusedRoute(route)
  }

  return (
    <main
      id="main-content"
      className="relative flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900"
    >
      {/* ── Executive Header ────────────────────────────────────────── */}
      <section className="rounded-(--radius) border border-border bg-background/90 p-4 shadow-sm backdrop-blur-md sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-(--radius) bg-primary/10 text-primary shadow-xs">
                <MapIcon className="size-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Cartographie & Traçabilité SIG
                </h1>
                <p className="text-xs text-muted-foreground">
                  Supervision spatiale des centres emplisseurs, flux VRAC et tournées sous contrôle CSPH
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 py-1 px-2.5 text-xs font-medium"
            >
              <Radio className="size-3 animate-pulse text-emerald-500" />
              Données simulées • Routes ArcGIS
            </Badge>

            <Badge variant="outline" className="py-1 px-2.5 text-xs text-muted-foreground">
              Axe Douala — Wouri (Littoral)
            </Badge>

            <Badge variant="secondary" className="font-semibold text-xs py-1 px-2.5">
              {userRole}
            </Badge>
          </div>
        </div>

        {/* ── Top Executive KPI Strip ───────────────────────────────── */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 border-t border-border pt-4">
          <div className="rounded-(--radius) border border-border bg-card/60 p-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Centres & Dépôts</span>
              <Building2 className="size-4 text-emerald-500" />
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">4 <span className="text-xs font-normal text-muted-foreground">sites</span></p>
            <p className="text-[11px] text-muted-foreground">SCDP & Total Bonabéri</p>
          </div>

          <div className="rounded-(--radius) border border-border bg-card/60 p-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Points Clients VRAC</span>
              <MapPin className="size-4 text-blue-500" />
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">4 <span className="text-xs font-normal text-muted-foreground">cuves</span></p>
            <p className="text-[11px] text-muted-foreground">Akwa Palace, Sawa, SABC</p>
          </div>

          <div className="rounded-(--radius) border border-border bg-card/60 p-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Volume VRAC Suivi</span>
              <Truck className="size-4 text-amber-500" />
            </div>
            <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
              {formatTm(33.5)}
            </p>
            <p className="text-[11px] text-muted-foreground">Citerne LT-982-AA & CE-415</p>
          </div>

          <div className="rounded-(--radius) border border-border bg-card/60 p-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Tournée en Transit</span>
              <Navigation className="size-4 text-primary" />
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">1 <span className="text-xs font-normal text-muted-foreground">active</span></p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Pont du Wouri (RN3)
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-(--radius) border border-border bg-card/60 p-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Alertes & Écarts</span>
              <AlertTriangle className="size-4 text-red-500" />
            </div>
            <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">1 <span className="text-xs font-normal text-muted-foreground">pesée</span></p>
            <p className="text-[11px] text-muted-foreground">Écart -0,8 TM Bonabéri</p>
          </div>
        </div>
      </section>

      {/* ── Interactive Map Section ─────────────────────────────────── */}
      <section className="relative rounded-(--radius) border border-border bg-background/95 p-3 shadow-md backdrop-blur-md">
        {/* Floating Quick Action Controls */}
        <div className="pointer-events-none absolute top-6 left-6 z-20 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="pointer-events-auto gap-2 bg-background/90 shadow-sm backdrop-blur text-xs font-medium"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Layers className="size-3.5 text-primary" />
            {showFilters ? 'Masquer filtres' : 'Filtres couches'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="pointer-events-auto gap-2 bg-background/90 shadow-sm backdrop-blur text-xs font-medium"
            onClick={() => setMapTheme(mapTheme === 'light' ? 'dark' : 'light')}
          >
            {mapTheme === 'light' ? (
              <>
                <Moon className="size-3.5 text-indigo-500" />
                Mode Sombre
              </>
            ) : (
              <>
                <Sun className="size-3.5 text-amber-500" />
                Mode Clair
              </>
            )}
          </Button>

          {currentRoute && (
            <Button
              size="sm"
              variant="secondary"
              className="pointer-events-auto gap-1.5 bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 shadow-xs text-xs font-medium"
              onClick={() => handleFocusRoute(currentRoute)}
            >
              <Navigation className="size-3.5 text-amber-600 dark:text-amber-400" />
              Centrer sur la tournée
            </Button>
          )}
        </div>

        {/* Floating Layer Filters Panel */}
        {showFilters && (
          <div className="pointer-events-auto absolute top-16 left-6 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
            <NationalMapFilters
              layers={layers}
              mapTheme={mapTheme}
              onChange={toggleLayer}
              className="w-64"
            />
          </div>
        )}

        {/* Floating Itinerary Card on the Right */}
        <div className="pointer-events-none absolute top-6 right-6 z-20 hidden md:block max-w-sm">
          <VracItineraryCard
            routes={routes}
            selectedRouteCode={selectedRouteCode}
            onSelectRoute={handleSelectRoute}
            onFocusRoute={handleFocusRoute}
          />
        </div>

        {/* Main Map Viewer */}
        <NationalMap
          routes={routes}
          mapTheme={mapTheme}
          layers={layers}
          focusedRoute={focusedRoute}
          onFocusRoute={handleFocusRoute}
          className="h-[740px] w-full rounded-(--radius)"
        />

        {/* Mobile Itinerary Drawer at bottom on small screens */}
        <div className="mt-3 block md:hidden">
          <VracItineraryCard
            routes={routes}
            selectedRouteCode={selectedRouteCode}
            onSelectRoute={handleSelectRoute}
            onFocusRoute={handleFocusRoute}
          />
        </div>
      </section>

      {/* ── Footer Information Strip ────────────────────────────────── */}
      <section className="rounded-(--radius) border border-border bg-background/80 p-3.5 text-xs text-muted-foreground shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-primary shrink-0" />
            <span>
              Données cartographiques consolidées CSPH • Volumes VRAC calculés exclusivement en <strong>tonnes métriques (TM)</strong>.
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" /> Dépôts & Emplisseurs
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-500" /> Cuves Clients
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" /> Tracé RN3 / Pont Wouri
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-red-500" /> Anomalies
            </span>
          </div>
        </div>
      </section>
    </main>
  )
}
