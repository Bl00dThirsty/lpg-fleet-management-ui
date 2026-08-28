export type MapTheme = 'light' | 'dark'

export function getArcgisBasemap(mapTheme: MapTheme): string {
  return mapTheme === 'dark' ? 'dark-gray-vector' : 'streets-navigation-vector'
}

export function getArcgisViewTheme(
  mapTheme: MapTheme,
): { accentColor: string; textColor: string } {
  return mapTheme === 'dark'
    ? { accentColor: '#86efac', textColor: '#f8fafc' }
    : { accentColor: '#16a34a', textColor: '#0f172a' }
}

export function getMarkerOutlineColor(
  mapTheme: MapTheme,
  isSelected: boolean,
): [number, number, number, number] {
  if (mapTheme === 'dark') {
    return isSelected ? [248, 250, 252, 1] : [226, 232, 240, 0.86]
  }
  return isSelected ? [255, 255, 255, 1] : [15, 23, 42, 0.28]
}

export function rgbaFromTuple(value: [number, number, number, number]): string {
  return `rgba(${value[0]}, ${value[1]}, ${value[2]}, ${value[3]})`
}

export const MAP_DEFAULTS = {
  DEFAULT_ZOOM: 7,
  MIN_ZOOM: 4,
  FOCUS_SITE_ZOOM: 12,
  FOCUS_REGION_ZOOM: 8,
  GPS_ZOOM: 11,
  GPS_TIMEOUT_MS: 8000,
  GPS_MAX_AGE_MS: 300000,
} as const

export const TRUCK_STATUS_COLORS = {
  DRAFT: [100, 116, 139, 0.9],
  PLANNED: [14, 165, 233, 0.95],
  PENDINGTRANSPORTERACK: [245, 158, 11, 0.95],
  ACKNOWLEDGED: [16, 185, 129, 0.95],
  INPROGRESS: [14, 165, 233, 0.95],
  CHECKPOINTACTIVE: [168, 85, 247, 0.95],
  CLOSED: [100, 116, 139, 0.9],
  CANCELLED: [239, 68, 68, 0.95],
} as const

export const HEATMAP_DEFAULTS = {
  radius: 22,
  maxPixelIntensity: 45,
  minPixelIntensity: 0,
  opacity: 0.85,
  colorStops: [
    { ratio: 0, color: 'rgba(255,255,255,0)' },
    { ratio: 0.2, color: 'rgba(255,255,178,0.7)' },
    { ratio: 0.4, color: 'rgba(254,204,92,0.8)' },
    { ratio: 0.6, color: 'rgba(253,141,60,0.85)' },
    { ratio: 0.8, color: 'rgba(240,59,32,0.9)' },
    { ratio: 1, color: 'rgba(189,0,38,0.95)' },
  ],
} as const

export const PERIOD_WINDOWS = {
  today: 0,
  week: 6,
  month: 29,
} as const

export const BOUNDARY_TOKENS = {
  country: {
    fill: [15, 23, 42, 0.02] as [number, number, number, number],
    outline: [15, 23, 42, 0.55] as [number, number, number, number],
    outlineWidth: 1.8,
    opacity: 0.95,
  },
  region: {
    fill: [99, 102, 241, 0.08] as [number, number, number, number],
    outline: [99, 102, 241, 0.9] as [number, number, number, number],
    outlineWidth: 1.4,
    opacity: 0.9,
  },
} as const
