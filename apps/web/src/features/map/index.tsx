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
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NationalMap } from './components/national-map'
import { NationalMapFilters } from './components/national-map-filters'
import { VracItineraryCard } from './components/vrac-itinerary-card'
import { getInitialLayers, type MapLayerKey } from './lib/layers'
import { type VracTourRoute } from './data/itineraries'
import { useVracRoadRoutes } from './data/road-routes'
import type { MapTheme } from './utils/map-theme'
import { formatTm } from './utils/format'
import { organizations } from '@/lib/entity-data'

export function NationalMapPage() {
  const [layers, setLayers] = useState<Record<MapLayerKey, boolean>>(getInitialLayers())
  const [mapTheme, setMapTheme] = useState<MapTheme>('light')
  const [showFilters, setShowFilters] = useState(false)
  const [showTourDrawer, setShowTourDrawer] = useState(true)
  const [selectedRouteCode, setSelectedRouteCode] = useState<string>('TR-VRAC-DLA-001')
  const authUser = useAuthStore((s) => s.user)
  const userRole = authUser?.system_role ?? 'CSPH'
  const isRegulator = !authUser || ['SUPERADMIN', 'ADMIN', 'SUPERVISOR', 'INTEGRATEUR'].includes(authUser.system_role)

  const myOrgName = useMemo(() => {
    if (!authUser?.org_id) return null
    return organizations.find((o) => o.id === authUser.org_id)?.name ?? null
  }, [authUser?.org_id])

  const allRoadRoutes = useVracRoadRoutes()

  const routes = useMemo(() => {
    if (isRegulator || !authUser?.org_id) return allRoadRoutes
    return allRoadRoutes.filter((r) => {
      if (r.marketerOrgId && authUser.org_id) {
        return r.marketerOrgId === authUser.org_id
      }
      if (myOrgName) {
        const lowerOrg = myOrgName.toLowerCase()
        return (
          r.marketerName.toLowerCase().includes(lowerOrg) ||
          lowerOrg.includes(r.marketerName.toLowerCase())
        )
      }
      return false
    })
  }, [allRoadRoutes, isRegulator, authUser?.org_id, myOrgName])

  const allMarketerNames = useMemo(() => {
    return Array.from(new Set(routes.map((r) => r.marketerName))).filter(Boolean)
  }, [routes])

  const [selectedMarketer, setSelectedMarketer] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return allMarketerNames
    const q = searchQuery.toLowerCase().trim()
    return allMarketerNames.filter((name) => name.toLowerCase().includes(q))
  }, [allMarketerNames, searchQuery])

  const filteredRoutes = useMemo(() => {
    if (selectedMarketer === 'ALL') {
      if (!searchQuery.trim()) return routes
      const q = searchQuery.toLowerCase().trim()
      return routes.filter(
        (r) =>
          r.marketerName.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.tourCode.toLowerCase().includes(q)
      )
    }
    return routes.filter((r) => r.marketerName === selectedMarketer)
  }, [routes, selectedMarketer, searchQuery])

  const currentRoute = useMemo(
    () =>
      filteredRoutes.find((r) => r.tourCode === selectedRouteCode) ??
      filteredRoutes[0] ??
      null,
    [filteredRoutes, selectedRouteCode],
  )
  const [focusedRoute, setFocusedRoute] = useState<VracTourRoute | null>(currentRoute)

  const toggleLayer = (key: MapLayerKey, enabled: boolean) => {
    setLayers((prev) => ({ ...prev, [key]: enabled }))
  }

  const handleSelectRoute = (code: string) => {
    setSelectedRouteCode(code)
    const match = filteredRoutes.find((r) => r.tourCode === code) ?? null
    setFocusedRoute(match)
  }

  const handleFocusRoute = (route: VracTourRoute) => {
    setSelectedRouteCode(route.tourCode)
    setFocusedRoute(route)
  }

  const handleSelectMarketer = (marketer: string) => {
    setSelectedMarketer(marketer)
    if (marketer !== 'ALL') {
      setSearchQuery('')
      const match = routes.find((r) => r.marketerName === marketer)
      if (match) {
        setSelectedRouteCode(match.tourCode)
        setFocusedRoute(match)
      }
    }
    setIsSearchFocused(false)
  }

  const handleResetFilter = () => {
    setSelectedMarketer('ALL')
    setSearchQuery('')
    if (routes[0]) {
      setSelectedRouteCode(routes[0].tourCode)
      setFocusedRoute(routes[0])
    }
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
              Données temps réel • Réseau SIG
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

      {/* ── Marketer Filter & Search Bar ──────────────────────────────── */}
      <section className="rounded-(--radius) border border-border bg-background/95 p-3.5 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
            {/* Search Input with Autocomplete Suggestions */}
            <div className="relative flex-1 max-w-md">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher un marketeur (TotalEnergies, Tradex, SCTM...)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (selectedMarketer !== 'ALL') setSelectedMarketer('ALL')
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  className="pl-9 pr-8 h-9 text-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      handleSelectMarketer('ALL')
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown list */}
              {isSearchFocused && suggestions.length > 0 && (
                <div
                  className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-lg backdrop-blur-md"
                  onMouseLeave={() => setIsSearchFocused(false)}
                >
                  <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Marketeurs proposés
                  </div>
                  {suggestions.map((marketer) => {
                    const count = routes.filter((r) => r.marketerName === marketer).length
                    return (
                      <button
                        key={marketer}
                        type="button"
                        onMouseDown={() => handleSelectMarketer(marketer)}
                        className="flex w-full items-center justify-between rounded px-2.5 py-1.5 text-xs text-left text-popover-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                      >
                        <span className="font-medium truncate pr-2">{marketer}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0 border-primary/30 text-primary">
                          {count} tournée{count > 1 ? 's' : ''}
                        </Badge>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick Select Marketer Dropdown */}
            <div className="w-full sm:w-64">
              <Select
                value={selectedMarketer}
                onValueChange={(val) => handleSelectMarketer(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Filter className="size-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Tous les marketeurs" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">
                    Tous les marketeurs ({routes.length} tournées)
                  </SelectItem>
                  {allMarketerNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reset Button */}
            {(selectedMarketer !== 'ALL' || searchQuery) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleResetFilter}
                className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="size-3.5" />
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Active Filter status */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
            <span>Affichage :</span>
            <Badge variant="secondary" className="font-semibold text-xs py-0.5">
              {selectedMarketer === 'ALL'
                ? searchQuery
                  ? `Recherche: "${searchQuery}"`
                  : 'Toutes les tournées'
                : selectedMarketer}
            </Badge>
            <span className="text-[11px]">
              ({filteredRoutes.length} tournée{filteredRoutes.length > 1 ? 's' : ''} visible{filteredRoutes.length > 1 ? 's' : ''})
            </span>
          </div>
        </div>
      </section>

      {/* ── Interactive Map Section ─────────────────────────────────── */}
      <section className="relative rounded-(--radius) border border-border bg-background/95 p-3 shadow-md backdrop-blur-md">
        {/* Floating Quick Action Controls (Shifted right to clear native ArcGIS zoom buttons) */}
        <div className="pointer-events-none absolute top-4 sm:top-5 left-16 sm:left-20 z-20 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="pointer-events-auto gap-2 border border-border/40 bg-background/35 shadow-sm backdrop-blur-xl text-xs font-medium hover:bg-background/60 text-foreground transition-all"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Layers className="size-3.5 text-primary" />
            {showFilters ? 'Masquer filtres' : 'Filtres couches'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="pointer-events-auto gap-2 border border-border/40 bg-background/35 shadow-sm backdrop-blur-xl text-xs font-medium hover:bg-background/60 text-foreground transition-all"
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
              className="pointer-events-auto gap-1.5 border border-amber-500/35 bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 shadow-sm backdrop-blur-xl text-xs font-medium transition-all"
              onClick={() => handleFocusRoute(currentRoute)}
            >
              <Navigation className="size-3.5 text-amber-600 dark:text-amber-400" />
              Centrer sur la tournée
            </Button>
          )}
        </div>

        {/* Floating Layer Filters Panel */}
        {showFilters && (
          <div className="pointer-events-auto absolute top-16 left-16 sm:left-20 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
            <NationalMapFilters
              layers={layers}
              mapTheme={mapTheme}
              onChange={toggleLayer}
              className="w-64"
            />
          </div>
        )}

        {/* Floating Itinerary Card on the Right (Collapsible with Vertical Lateral Tab at Middle Right) */}
        {showTourDrawer ? (
          <div className="pointer-events-none absolute top-4 sm:top-6 right-4 sm:right-6 z-20 hidden md:block max-w-sm animate-in fade-in slide-in-from-right-4 duration-200">
            <VracItineraryCard
              routes={filteredRoutes}
              selectedRouteCode={selectedRouteCode}
              onSelectRoute={handleSelectRoute}
              onFocusRoute={handleFocusRoute}
              onClose={() => setShowTourDrawer(false)}
            />
          </div>
        ) : (
          <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 right-0 z-20 hidden md:block animate-in fade-in slide-in-from-right-3 duration-200">
            <button
              type="button"
              onClick={() => setShowTourDrawer(true)}
              className="pointer-events-auto group flex flex-col items-center justify-center gap-2 rounded-l-xl border border-r-0 border-border/40 bg-background/40 hover:bg-background/65 backdrop-blur-xl px-2 py-4 shadow-2xl transition-all hover:pl-3 cursor-pointer text-foreground"
              title="Afficher le volet de suivi des tournées"
            >
              <ChevronLeft className="size-4 text-amber-500 transition-transform group-hover:-translate-x-1" />
              <span className="[writing-mode:vertical-rl] rotate-180 py-1 text-xs font-semibold tracking-wider text-foreground select-none uppercase">
                Suivi Tournée
              </span>
            </button>
          </div>
        )}

        {/* Main Map Viewer */}
        <NationalMap
          routes={filteredRoutes}
          mapTheme={mapTheme}
          layers={layers}
          focusedRoute={focusedRoute}
          onFocusRoute={handleFocusRoute}
          className="h-[740px] w-full rounded-(--radius)"
        />

        {/* Mobile Itinerary Drawer at bottom on small screens */}
        <div className="mt-3 block md:hidden">
          <div className="flex items-center justify-between py-1">
            <button
              type="button"
              onClick={() => setShowTourDrawer(!showTourDrawer)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors"
            >
              <Truck className="size-3.5 text-amber-500" />
              {showTourDrawer ? 'Masquer le volet de tournée' : 'Afficher le volet de tournée'}
              {showTourDrawer ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
          </div>
          {showTourDrawer && (
            <VracItineraryCard
              routes={routes}
              selectedRouteCode={selectedRouteCode}
              onSelectRoute={handleSelectRoute}
              onFocusRoute={handleFocusRoute}
              onClose={() => setShowTourDrawer(false)}
            />
          )}
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
