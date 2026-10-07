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
  Factory,
  Fuel,
  Package,
  Clock,
  Anchor,
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
  }, [authUser])

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
  }, [allRoadRoutes, isRegulator, authUser, myOrgName])

  const allMarketerNames = useMemo(() => {
    return Array.from(new Set(routes.map((r) => r.marketerName))).filter(Boolean)
  }, [routes])

  const [selectedMarketer, setSelectedMarketer] = useState<string>('ALL')
  const [selectedTruckFilter, setSelectedTruckFilter] = useState<'ALL' | 'ACTIVE_ONLY' | 'VRAC_ONLY' | 'B50_ONLY'>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'INPROGRESS' | 'PLANNED' | 'ALERT'>('ALL')
  const [selectedOrigin, setSelectedOrigin] = useState<'ALL' | 'SCDP' | 'SNH' | 'MARKETER'>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return allMarketerNames
    const q = searchQuery.toLowerCase().trim()
    return allMarketerNames.filter((name) => name.toLowerCase().includes(q))
  }, [allMarketerNames, searchQuery])

  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      // 1. Marketeur
      if (selectedMarketer !== 'ALL' && r.marketerName !== selectedMarketer) {
        return false
      }
      // 2. Recherche textuelle
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesQuery =
          r.marketerName.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.tourCode.toLowerCase().includes(q) ||
          r.vehiclePlate.toLowerCase().includes(q) ||
          r.driverName.toLowerCase().includes(q) ||
          r.destinationName.toLowerCase().includes(q) ||
          r.departureName.toLowerCase().includes(q)
        if (!matchesQuery) return false
      }
      // 3. Type de camion / Activité
      if (selectedTruckFilter === 'ACTIVE_ONLY' && r.status !== 'INPROGRESS') {
        return false
      }
      if (
        selectedTruckFilter === 'VRAC_ONLY' &&
        !r.vehicleType.toLowerCase().includes('citerne') &&
        !r.vehicleType.toLowerCase().includes('vrac')
      ) {
        return false
      }
      if (
        selectedTruckFilter === 'B50_ONLY' &&
        !r.vehicleType.toLowerCase().includes('plateau') &&
        !r.vehicleType.toLowerCase().includes('50')
      ) {
        return false
      }
      // 4. Statut de la tournée
      if (selectedStatus === 'INPROGRESS' && r.status !== 'INPROGRESS') {
        return false
      }
      if (selectedStatus === 'PLANNED' && r.status !== 'PLANNED') {
        return false
      }
      if (selectedStatus === 'ALERT') {
        if (r.id !== 'tour-vrac-dla-001') return false
      }
      // 5. Origine / Dépôt source
      if (selectedOrigin === 'SCDP' && !r.departureName.toLowerCase().includes('scdp')) {
        return false
      }
      if (
        selectedOrigin === 'SNH' &&
        !r.departureName.toLowerCase().includes('snh') &&
        !r.departureName.toLowerCase().includes('sonara')
      ) {
        return false
      }
      if (
        selectedOrigin === 'MARKETER' &&
        (r.departureName.toLowerCase().includes('scdp') ||
          r.departureName.toLowerCase().includes('snh') ||
          r.departureName.toLowerCase().includes('sonara'))
      ) {
        return false
      }

      return true
    })
  }, [routes, selectedMarketer, searchQuery, selectedTruckFilter, selectedStatus, selectedOrigin])

  // Métriques consolidées pour les cards exécutives
  const totalFilteredVolumeTM = useMemo(() => {
    return filteredRoutes.reduce((sum, r) => sum + r.loadedQuantityTM, 0)
  }, [filteredRoutes])

  const totalFilteredBottles50kg = useMemo(() => {
    return Math.round(totalFilteredVolumeTM * 20)
  }, [totalFilteredVolumeTM])

  const activeFilteredTrucksCount = useMemo(() => {
    return filteredRoutes.filter((r) => r.status === 'INPROGRESS').length
  }, [filteredRoutes])

  const alertRoutesCount = useMemo(() => {
    return filteredRoutes.filter((r) => r.id === 'tour-vrac-dla-001').length
  }, [filteredRoutes])

  const isAnyFilterActive =
    selectedMarketer !== 'ALL' ||
    selectedTruckFilter !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedOrigin !== 'ALL' ||
    Boolean(searchQuery.trim())

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
    setSelectedTruckFilter('ALL')
    setSelectedStatus('ALL')
    setSelectedOrigin('ALL')
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

        {/* ── Top Executive KPI Strip (Strict separation: SCDP/SNH vs Marketers vs Clients) ── */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 border-t border-border pt-4">
          {/* Card 1 : Dépôts Stratégiques Amont (SCDP & SNH uniquement) */}
          <div className="rounded-(--radius) border border-border bg-card/60 p-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Dépôts Stratégiques Amont</span>
              <Building2 className="size-4 text-emerald-500" />
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">
              2 <span className="text-xs font-normal text-muted-foreground">dépôts sources</span>
            </p>
            <p className="text-[11px] text-muted-foreground">SCDP Bonabéri & SNH Bipaga</p>
          </div>

          {/* Card 2 : Centres Emplisseurs Marketeurs (Privés uniquement) */}
          <div className="rounded-(--radius) border border-border bg-card/60 p-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Centres Emplisseurs Marketeurs</span>
              <Factory className="size-4 text-blue-500" />
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">
              {allMarketerNames.length} <span className="text-xs font-normal text-muted-foreground">marketeurs</span>
            </p>
            <p className="text-[11px] text-muted-foreground">Total, Tradex, SCTM, Camgaz...</p>
          </div>

          {/* Card 3 : Points Clients Finaux (Industries & Hôtellerie hors réseau) */}
          <div className="rounded-(--radius) border border-border bg-card/60 p-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Points Clients (VRAC & B50)</span>
              <MapPin className="size-4 text-indigo-500" />
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">
              4 <span className="text-xs font-normal text-muted-foreground">cuves & sites</span>
            </p>
            <p className="text-[11px] text-muted-foreground">Akwa Palace, Sawa, SABC...</p>
          </div>

          {/* Card 4 : Volumétrie en Transit Suivie (Cohérence TM vs B50) */}
          <div className="rounded-(--radius) border border-border bg-card/60 p-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Volumétrie Suivie en Transit</span>
              <Truck className="size-4 text-amber-500" />
            </div>
            <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-400">
              {formatTm(totalFilteredVolumeTM)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {activeFilteredTrucksCount} camion{activeFilteredTrucksCount > 1 ? 's' : ''} actif{activeFilteredTrucksCount > 1 ? 's' : ''} • {totalFilteredBottles50kg.toLocaleString('fr-FR')} btl (50kg)
            </p>
          </div>

          {/* Card 5 : Alertes & Écarts de Pesée */}
          <div className="col-span-2 sm:col-span-1 rounded-(--radius) border border-border bg-card/60 p-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Alertes & Écarts</span>
              <AlertTriangle className="size-4 text-red-500" />
            </div>
            <p className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
              {alertRoutesCount} <span className="text-xs font-normal text-muted-foreground">pesée</span>
            </p>
            <p className="text-[11px] text-muted-foreground">Écart -0,8 TM Bonabéri (RN3)</p>
          </div>
        </div>
      </section>

      {/* ── Multi-criteria Filtering Panel (Formulaire de filtrage complet) ── */}
      <section className="rounded-(--radius) border border-border bg-background/95 p-3.5 shadow-sm backdrop-blur-md">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <Filter className="size-3.5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Filtres & Sélection Opérationnelle
              </span>
            </div>
            {isAnyFilterActive && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleResetFilter}
                className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
                Réinitialiser
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {/* 1. Recherche Texte */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Recherche (tournée, plaque...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="pl-8 pr-7 h-9 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              )}

              {/* Suggestions */}
              {isSearchFocused && suggestions.length > 0 && (
                <div
                  className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-lg backdrop-blur-md"
                  onMouseLeave={() => setIsSearchFocused(false)}
                >
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">
                    Marketeurs suggérés
                  </div>
                  {suggestions.map((marketer) => (
                    <button
                      key={marketer}
                      type="button"
                      onMouseDown={() => {
                        handleSelectMarketer(marketer)
                        setIsSearchFocused(false)
                      }}
                      className="flex w-full items-center justify-between rounded px-2 py-1 text-xs text-popover-foreground hover:bg-accent cursor-pointer"
                    >
                      <span className="font-medium truncate">{marketer}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Filtre Marketeur */}
            <div>
              <Select
                value={selectedMarketer}
                onValueChange={(val) => handleSelectMarketer(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Marketeur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">
                    Tous les marketeurs
                  </SelectItem>
                  {allMarketerNames.map((name) => (
                    <SelectItem key={name} value={name} className="text-xs">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Filtre Camions / Véhicules */}
            <div>
              <Select
                value={selectedTruckFilter}
                onValueChange={(val: 'ALL' | 'ACTIVE_ONLY' | 'VRAC_ONLY' | 'B50_ONLY') => setSelectedTruckFilter(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Flotte camions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">
                    Tous les camions ({routes.length})
                  </SelectItem>
                  <SelectItem value="ACTIVE_ONLY" className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <Truck className="size-3.5 text-emerald-500" />
                      <span>Camions actifs en transit ({routes.filter((r) => r.status === 'INPROGRESS').length})</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="VRAC_ONLY" className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <Fuel className="size-3.5 text-amber-500" />
                      <span>Citernes VRAC uniquement</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="B50_ONLY" className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <Package className="size-3.5 text-sky-500" />
                      <span>Plateaux Bouteilles 50 kg</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 4. Filtre Statut de tournée */}
            <div>
              <Select
                value={selectedStatus}
                onValueChange={(val: 'ALL' | 'INPROGRESS' | 'PLANNED' | 'ALERT') => setSelectedStatus(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Statut tournée" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">
                    Tous les statuts
                  </SelectItem>
                  <SelectItem value="INPROGRESS" className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <Radio className="size-3.5 text-emerald-500" />
                      <span>En cours / En transit</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="PLANNED" className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-sky-500" />
                      <span>Planifiée</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="ALERT" className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="size-3.5 text-rose-500" />
                      <span>Écart de pesée / Alerte</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 5. Filtre Dépôt Source / Origine */}
            <div>
              <Select
                value={selectedOrigin}
                onValueChange={(val: 'ALL' | 'SCDP' | 'SNH' | 'MARKETER') => setSelectedOrigin(val)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Origine départ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">
                    Toutes origines
                  </SelectItem>
                  <SelectItem value="SCDP" className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-emerald-500" />
                      <span>Dépôts SCDP (Bonabéri, Nsam...)</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="SNH" className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <Anchor className="size-3.5 text-blue-500" />
                      <span>Terminal SNH / SONARA</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="MARKETER" className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <Factory className="size-3.5 text-amber-500" />
                      <span>Centres Emplisseurs Privés</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bandeau d'état et résumé des filtres */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Résultats filtrés :</span>
              <Badge variant="secondary" className="font-semibold text-xs py-0.5">
                {filteredRoutes.length} tournée{filteredRoutes.length > 1 ? 's' : ''}
              </Badge>
              <span>•</span>
              <span className="font-medium text-foreground">
                {formatTm(totalFilteredVolumeTM)}
              </span>
              <span>suivis ({totalFilteredBottles50kg.toLocaleString('fr-FR')} btl équiv. 50 kg)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                {activeFilteredTrucksCount} camion{activeFilteredTrucksCount > 1 ? 's' : ''} actif{activeFilteredTrucksCount > 1 ? 's' : ''} sur le réseau routier
              </span>
            </div>
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
