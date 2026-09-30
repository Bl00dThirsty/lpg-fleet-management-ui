import lpgCenterSvgRaw from '@/assets/lpg.svg?raw'
import lpgSphereIconUrl from '@/assets/lpg-sphere.png'

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

export function getLpgMarkerIcon(mapTheme: MapTheme): string {
  const fillColor = mapTheme === 'dark' ? '#f8fafc' : '#0f172a'
  return svgToDataUri(lpgCenterSvgRaw.replace(/#000000/g, fillColor))
}

export function getSiteIconUrl(
  siteType: 'depot' | 'scdp' | 'filling-center' | 'marketer' | 'delivery-point',
  mapTheme: MapTheme,
): string {
  if (siteType === 'filling-center') return getLpgMarkerIcon(mapTheme)
  return lpgSphereIconUrl
}
