import Graphic from '@arcgis/core/Graphic'
import Point from '@arcgis/core/geometry/Point'
import depotIconUrl from '@/assets/depot-icon.png'
import fillingCenterMarketerIconUrl from '@/assets/filling-center-marketer-icon.png'
import clientIconUrl from '@/assets/client-icon.png'
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
    iconKind: 'picture'
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
    iconKind: 'picture',
    style: 'circle',
    size: 28,
    haloSize: 34,
    iconWidth: 28,
    iconHeight: 28,
    swatch: 'rgba(22, 163, 74, 0.95)',
  },
  scdp: {
    color: [59, 130, 246, 0.95],
    haloColor: [59, 130, 246, 0.2],
    iconKind: 'picture',
    style: 'diamond',
    size: 28,
    haloSize: 34,
    iconWidth: 28,
    iconHeight: 28,
    swatch: 'rgba(59, 130, 246, 0.95)',
  },
  'filling-center': {
    color: [245, 158, 11, 0.95],
    haloColor: [245, 158, 11, 0.2],
    iconKind: 'picture',
    style: 'square',
    size: 26,
    haloSize: 32,
    iconWidth: 26,
    iconHeight: 26,
    swatch: 'rgba(245, 158, 11, 0.95)',
  },
  marketer: {
    color: [168, 85, 247, 0.95],
    haloColor: [168, 85, 247, 0.2],
    iconKind: 'picture',
    style: 'triangle',
    size: 26,
    haloSize: 32,
    iconWidth: 26,
    iconHeight: 26,
    swatch: 'rgba(168, 85, 247, 0.95)',
  },
  'delivery-point': {
    color: [236, 72, 153, 0.95],
    haloColor: [236, 72, 153, 0.2],
    iconKind: 'picture',
    style: 'x',
    size: 24,
    haloSize: 30,
    iconWidth: 24,
    iconHeight: 24,
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
        size: marker.haloSize ?? marker.size + 8,
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

export function getSiteIconUrl(siteType: SiteType, _mapTheme?: MapTheme) {
  if (siteType === 'depot' || siteType === 'scdp') {
    return depotIconUrl
  }
  if (siteType === 'filling-center' || siteType === 'marketer') {
    return fillingCenterMarketerIconUrl
  }
  return clientIconUrl
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

export function popupLine(
  label: string,
  value: string | undefined | null,
  options?: { rawHtml?: boolean }
) {
  const safeValue = value ?? ''
  const renderedValue = options?.rawHtml ? safeValue : escapePopupValue(String(safeValue))
  return `
    <p class="fleet-truck-popup__row">
      <strong>${label}</strong>
      <span>${renderedValue}</span>
    </p>
  `
}

export function popupHtmlLine(label: string, htmlValue: string) {
  return popupLine(label, htmlValue, { rawHtml: true })
}

export function escapePopupValue(value: string | undefined | null) {
  if (!value) return ''
  return String(value).replace(/[&<>"']/g, (character) => {
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
