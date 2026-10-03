import Graphic from '@arcgis/core/Graphic'
import Point from '@arcgis/core/geometry/Point'
import lpgSphereIconUrl from '@/assets/lpg-sphere.png'
import lpgCenterSvgRaw from '@/assets/lpg.svg?raw'
import {
  siteStatusLabels,
  siteTypeLabels,
  type Site,
  type SiteType,
} from '../data/sites'

export type MapTheme = 'light' | 'dark'

export const siteMarkerTokens: Record<
  SiteType,
  {
    color: [number, number, number, number]
    haloColor: [number, number, number, number]
    iconKind: 'sphere' | 'lpg' | 'marker'
    style: 'circle' | 'diamond' | 'square' | 'triangle' | 'x'
    size: number
    haloSize?: number
    iconWidth?: number
    iconHeight?: number
    swatch: string
  }
> = {
  depot: {
    color: [22, 163, 74, 0.95],
    haloColor: [22, 163, 74, 0.22],
    iconKind: 'sphere',
    style: 'circle',
    size: 26,
    haloSize: 32,
    iconWidth: 26,
    iconHeight: 26,
    swatch: 'rgba(22, 163, 74, 0.95)',
  },
  scdp: {
    color: [59, 130, 246, 0.95],
    haloColor: [59, 130, 246, 0.2],
    iconKind: 'sphere',
    style: 'diamond',
    size: 24,
    haloSize: 30,
    iconWidth: 24,
    iconHeight: 24,
    swatch: 'rgba(59, 130, 246, 0.95)',
  },
  'filling-center': {
    color: [245, 158, 11, 0.95],
    haloColor: [245, 158, 11, 0.2],
    iconKind: 'lpg',
    style: 'square',
    size: 20,
    haloSize: 30,
    iconWidth: 20,
    iconHeight: 20,
    swatch: 'rgba(245, 158, 11, 0.95)',
  },
  marketer: {
    color: [168, 85, 247, 0.95],
    haloColor: [168, 85, 247, 0.95],
    iconKind: 'marker',
    style: 'triangle',
    size: 12,
    swatch: 'rgba(168, 85, 247, 0.95)',
  },
  'delivery-point': {
    color: [236, 72, 153, 0.95],
    haloColor: [236, 72, 153, 0.95],
    iconKind: 'marker',
    style: 'x',
    size: 12,
    swatch: 'rgba(236, 72, 153, 0.95)',
  },
}

export function createSiteGraphics(site: Site, mapTheme: MapTheme) {
  const outlineColor = getSiteOutlineColor(mapTheme)
  const marker = siteMarkerTokens[site.type]
  const popupTemplate = {
    title: site.name,
    content: createSitePopupContent(site, mapTheme),
  }
  const baseAttributes = {
    kind: 'site',
    siteId: site.id,
    siteType: site.type,
  }

  if (marker.iconKind === 'marker') {
    return [
      new Graphic({
        geometry: new Point({
          longitude: site.longitude,
          latitude: site.latitude,
          spatialReference: { wkid: 4326 },
        }),
        symbol: {
          type: 'simple-marker',
          style: marker.style,
          color: marker.color,
          size: marker.size,
          outline: {
            color: outlineColor,
            width: 1.5,
          },
        },
        attributes: baseAttributes,
        popupTemplate,
      }),
    ]
  }

  return [
    new Graphic({
      geometry: new Point({
        longitude: site.longitude,
        latitude: site.latitude,
        spatialReference: { wkid: 4326 },
      }),
      symbol: {
        type: 'simple-marker',
        style: 'circle',
        color: marker.haloColor,
        size: marker.haloSize ?? marker.size + 10,
        outline: {
          color: outlineColor,
          width: 1.5,
        },
      },
      attributes: baseAttributes,
      popupTemplate,
    }),
    new Graphic({
      geometry: new Point({
        longitude: site.longitude,
        latitude: site.latitude,
        spatialReference: { wkid: 4326 },
      }),
      symbol: {
        type: 'picture-marker',
        url: getSiteIconUrl(site.type, mapTheme),
        width: marker.iconWidth ?? marker.size,
        height: marker.iconHeight ?? marker.size,
      },
      attributes: baseAttributes,
      popupTemplate,
    }),
  ]
}

export function getSiteIconUrl(siteType: SiteType, mapTheme: MapTheme) {
  if (siteType === 'filling-center') {
    return getLpgMarkerIcon(mapTheme)
  }

  return lpgSphereIconUrl
}

export function getSiteOutlineColor(mapTheme: MapTheme): [
  number,
  number,
  number,
  number,
] {
  return mapTheme === 'dark'
    ? [226, 232, 240, 0.84]
    : [15, 23, 42, 0.28]
}

export function getLpgMarkerIcon(mapTheme: MapTheme) {
  const fillColor = mapTheme === 'dark' ? '#f8fafc' : '#0f172a'

  return svgToDataUri(lpgCenterSvgRaw.replace(/#000000/g, fillColor))
}

export function svgToDataUri(svg: string) {
  const normalizedSvg = svg.replace(/\s+/g, ' ').trim()
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(normalizedSvg)}`
}

export function createSitePopupContent(site: Site, mapTheme: MapTheme) {
  return `
    <div class="fleet-truck-popup" data-popup-theme="${mapTheme}">
      ${popupLine('Type', siteTypeLabels[site.type])}
      ${popupLine('Operateur', site.operator)}
      ${popupLine('Ville', site.city)}
      ${popupLine('Region', site.region)}
      ${popupLine('Statut', siteStatusLabels[site.status])}
      ${popupLine('Role', site.description)}
    </div>
  `
}

export function popupLine(label: string, value: string) {
  return `
    <p class="fleet-truck-popup__row">
      <strong>${label}</strong>
      <span>${escapePopupValue(value)}</span>
    </p>
  `
}

export function escapePopupValue(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }

    return entities[character] ?? character
  })
}
