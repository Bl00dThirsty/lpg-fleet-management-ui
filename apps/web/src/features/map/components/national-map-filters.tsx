import { LAYER_LABELS, type MapLayerKey } from '@/features/map/lib/layers'
import { LegendSiteIcon } from '@/features/map/utils/legend'
import type { MapTheme } from '@/features/map/utils/map-theme'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export type NationalMapFiltersProps = {
  layers: Record<MapLayerKey, boolean>
  mapTheme?: MapTheme
  onChange: (key: MapLayerKey, enabled: boolean) => void
}

const USEFUL_LAYER_KEYS: MapLayerKey[] = [
  'sites',
  'clientSites',
  'zoneBoundaries',
  'countryBoundaries',
  'trucks',
  'checkpoints',
  'anomalies',
  'heatmap',
]

export function NationalMapFilters({
  layers,
  mapTheme = 'light',
  onChange,
}: NationalMapFiltersProps) {
  return (
    <nav className="pointer-events-auto absolute bottom-20 left-4 flex flex-col gap-2 overflow-y-auto rounded-2xl bg-background/70 p-3 shadow-lg backdrop-blur-md max-h-[calc(100vh-220px)]">
      <p className="mb-1 text-xs font-semibold text-foreground/80">
        Couches de la carte — utile (filtré entreprise)
      </p>
      {(Object.keys(layers) as MapLayerKey[])
        .filter((key) => USEFUL_LAYER_KEYS.includes(key))
        .map((key) => (
        <div
          key={key}
          className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5 hover:bg-accent/40"
        >
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            {key === 'sites' ? (
              <span className="shrink-0">
                <LegendSiteIcon type="filling-center" mapTheme={mapTheme} />
              </span>
            ) : null}
            <Label htmlFor={`layer-${key}`} className="cursor-pointer">
              {LAYER_LABELS[key]}
            </Label>
          </div>
          <Switch
            id={`layer-${key}`}
            checked={layers[key]}
            onCheckedChange={(checked) => onChange(key, checked)}
          />
        </div>
      ))}
    </nav>
  )
}
