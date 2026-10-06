import depotIconUrl from '@/assets/depot-icon.png'
import fillingCenterMarketerIconUrl from '@/assets/filling-center-marketer-icon.png'
import clientIconUrl from '@/assets/client-icon.png'

export type MapTheme = 'light' | 'dark'

export function getArcgisBasemap(mapTheme: MapTheme, forceOsm = false): string {
  if (forceOsm) return 'osm'
  return mapTheme === 'dark' ? 'dark-gray' : 'streets'
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

export function getSiteOutlineColor(mapTheme: MapTheme): [number, number, number, number] {
  return mapTheme === 'dark' ? [226, 232, 240, 0.84] : [15, 23, 42, 0.28]
}

export function svgToDataUri(svg: string): string {
  const normalizedSvg = svg.replace(/\s+/g, ' ').trim()
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(normalizedSvg)}`
}

export function rgbaFromTuple(value: [number, number, number, number]): string {
  return `rgba(${value[0]}, ${value[1]}, ${value[2]}, ${value[3]})`
}

export function getSiteIconUrl(
  siteType: 'depot' | 'scdp' | 'filling-center' | 'marketer' | 'delivery-point',
  _mapTheme?: MapTheme,
): string {
  if (siteType === 'depot' || siteType === 'scdp') return depotIconUrl
  if (siteType === 'filling-center' || siteType === 'marketer') return fillingCenterMarketerIconUrl
  return clientIconUrl
}
