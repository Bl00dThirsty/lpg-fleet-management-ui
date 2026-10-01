import { LAYER_LABELS, type MapLayerKey } from '@/features/map/lib/layers'
import { LegendSiteIcon } from '@/features/map/utils/legend'
import type { MapTheme } from '@/features/map/utils/map-theme'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Layers, Route, AlertTriangle, Building2, MapPin, Globe } from 'lucide-react'

export type NationalMapFiltersProps = {
  layers: Record<MapLayerKey, boolean>
  mapTheme?: MapTheme
  onChange: (key: MapLayerKey, enabled: boolean) => void
  className?: string
}

function layerIcon(key: MapLayerKey, mapTheme: MapTheme) {
  switch (key) {
    case 'sites':
      return <LegendSiteIcon type="filling-center" mapTheme={mapTheme} />
    case 'clientSites':
      return <MapPin className="size-3.5 text-blue-500" />
    case 'routes':
      return <Route className="size-3.5 text-amber-500" />
    case 'anomalies':
      return <AlertTriangle className="size-3.5 text-red-500" />
    case 'regions':
      return <Globe className="size-3.5 text-indigo-500" />
    case 'zones':
      return <Building2 className="size-3.5 text-purple-500" />
    default:
      return null
  }
}

export function NationalMapFilters({
  layers,
  mapTheme = 'light',
  onChange,
  className = '',
}: NationalMapFiltersProps) {
  return (
    <nav
      className={`pointer-events-auto flex flex-col gap-1.5 rounded-(--radius) border border-border/40 bg-background/50 p-3 shadow-2xl backdrop-blur-xl max-h-[calc(100vh-220px)] overflow-y-auto ${className}`}
    >
      <div className="flex items-center gap-1.5 border-b border-border pb-2 px-1">
        <Layers className="size-3.5 text-primary" />
        <p className="text-xs font-semibold text-foreground/90">
          Couches cartographiques
        </p>
      </div>

      <div className="space-y-1 pt-1">
        {(Object.keys(layers) as MapLayerKey[]).map((key) => {
          const icon = layerIcon(key, mapTheme)
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-(--radius) px-2 py-1.5 transition-colors hover:bg-accent/50"
            >
              <div className="inline-flex items-center gap-2 text-xs text-foreground/80">
                {icon ? <span className="shrink-0">{icon}</span> : null}
                <Label htmlFor={`layer-${key}`} className="cursor-pointer font-medium text-xs">
                  {LAYER_LABELS[key] ?? key}
                </Label>
              </div>
              <Switch
                id={`layer-${key}`}
                checked={layers[key] ?? false}
                onCheckedChange={(checked) => onChange(key, checked)}
                className="scale-85"
              />
            </div>
          )
        })}
      </div>
    </nav>
  )
}
