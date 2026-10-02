import { useState } from 'react'
import {
  Truck,
  ChevronDown,
  ChevronUp,
  Navigation,
  CircleDot,
  Radio,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatTm } from '../utils/format'
import type { VracTourRoute } from '../data/itineraries'

export interface VracItineraryCardProps {
  routes: readonly VracTourRoute[]
  selectedRouteCode: string
  onSelectRoute: (routeCode: string) => void
  onFocusRoute: (route: VracTourRoute) => void
  onClose?: () => void
  className?: string
}

export function VracItineraryCard({
  routes,
  selectedRouteCode,
  onSelectRoute,
  onFocusRoute,
  onClose,
  className = '',
}: VracItineraryCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const currentRoute = routes.find((r) => r.tourCode === selectedRouteCode) ?? routes[0]

  if (!currentRoute) return null

  return (
    <div
      className={`pointer-events-auto w-full max-w-md rounded-(--radius) border border-border/40 bg-background/50 p-4 shadow-2xl backdrop-blur-xl transition-all ${className}`}
    >
      {/* Header with Tour Selector */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-(--radius) bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Truck className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs tracking-wider uppercase text-muted-foreground">
                Traçabilité VRAC
              </span>
              <Badge
                variant="outline"
                className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium"
              >
                <Radio className="size-2.5 animate-pulse" />
                Position simulée
              </Badge>
            </div>
            <h3 className="font-bold text-sm text-foreground leading-tight">
              {currentRoute.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="size-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Réduire le panneau' : 'Agrandir le panneau'}
          >
            {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
          {onClose && (
            <Button
              size="sm"
              variant="ghost"
              className="size-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={onClose}
              title="Masquer le volet"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tour Selection Pills */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {routes.map((route) => {
          const isSelected = route.tourCode === selectedRouteCode
          return (
            <button
              key={route.tourCode}
              type="button"
              onClick={() => onSelectRoute(route.tourCode)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <CircleDot className={`size-3 ${isSelected ? 'text-amber-300' : 'text-muted-foreground'}`} />
              {route.tourCode}
            </button>
          )
        })}
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3 pt-1 text-xs">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 rounded-(--radius) bg-muted/40 p-2.5">
            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground">Volume GPL</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {formatTm(currentRoute.loadedQuantityTM)}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground">Distance / Durée</span>
              <p className="font-semibold text-foreground text-xs">
                {currentRoute.roadStatus === 'success'
                  ? `${currentRoute.distanceKm} km • ~${currentRoute.estimatedDurationMin} min`
                  : currentRoute.roadStatus === 'error' ? 'Indisponible' : 'Calcul…'}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground">Pression Cuve</span>
              <p className="font-semibold text-foreground text-xs">
                {currentRoute.pressureBars} bars
              </p>
            </div>
          </div>

          {/* Logistics & Crew Info */}
          <div className="rounded-(--radius) border border-border bg-card/60 p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Transporteur :</span>
              <span className="font-medium text-foreground">{currentRoute.transporterName}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Citerne & Immat. :</span>
              <span className="font-medium text-foreground">{currentRoute.vehiclePlate}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Chauffeur qualifié :</span>
              <span className="font-medium text-foreground">{currentRoute.driverName}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Statut opérationnel :</span>
              <Badge variant="secondary" className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                {currentRoute.statusLabel}
              </Badge>
            </div>
          </div>

          {/* Route Milestones / Timeline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-foreground/80">
              <span>Jalons de l'itinéraire</span>
              <span className="text-muted-foreground">Départ {currentRoute.startedAt}</span>
            </div>

            <div className="relative pl-5 space-y-2.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {currentRoute.checkpoints.map((cp) => {
                const isDone = cp.status === 'COMPLETED'
                const isCurrent = cp.status === 'INPROGRESS'

                return (
                  <div key={cp.id} className="relative flex items-start gap-2">
                    <span
                      className={`absolute -left-5 mt-0.5 flex size-4 items-center justify-center rounded-full text-[9px] ${
                        isDone
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-muted-foreground/30 text-background'
                      }`}
                    >
                      {isDone ? '✓' : isCurrent ? '●' : '○'}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${isCurrent ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-foreground'}`}>
                          {cp.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {cp.actualTime ?? cp.plannedTime}
                        </span>
                      </div>
                      {cp.notes && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">
                          {cp.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-1">
            <Button
              size="sm"
              className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
              onClick={() => onFocusRoute(currentRoute)}
            >
              <Navigation className="size-3.5" />
              Centrer sur le tracé de la tournée
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
