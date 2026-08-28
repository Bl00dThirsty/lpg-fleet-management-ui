import Graphic from '@arcgis/core/Graphic'
import Point from '@arcgis/core/geometry/Point'
import lpgSphereIconUrl from '@/assets/lpg-sphere.png'
import lpgTankIconUrl from '@/assets/lpg-tank.png'
import lpgCenterSvgRaw from '@/assets/lpg.svg?raw'
import {
  siteStatusLabels,
  siteTypeLabels,
  type Site,
  type SiteType,
} from '../data/sites'

import type { MapTheme } from '@/features/map/utils/map-theme'

const factorySvgRaw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000"><path d="M3 20V8l5-2v14H3zm5 0V10h3v10H8zm3 0V12l6-2v10h-6z"/><rect x="2" y="18" width="19" height="1.2" rx="0.6" opacity="0.9"/><rect x="6" y="6" width="1.2" height="2" rx="0.3"/><rect x="14" y="4.5" width="1.4" height="3" rx="0.3"/></svg>`
const houseSvgRaw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000"><path d="M12 3.2L3 11v9.5h6.2v-5.2h5.6v5.2H21V11L12 3.2z"/><rect x="9.5" y="12.5" width="5" height="3.2" rx="0.6" fill="white" opacity="0.92"/></svg>`

export const siteMarkerTokens: Record<
  SiteType,
  {
    color: [number, number, number, number]
    haloColor: [number, number, number, number]
    iconKind: 'sphere' | 'lpg' | 'factory' | 'house'
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
    iconKind: 'sphere',
    style: 'square',
    size: 26,
    haloSize: 32,
    iconWidth: 26,
    iconHeight: 26,
    swatch: 'rgba(245, 158, 11, 0.95)',
  },
  marketer: {
    color: [168, 85, 247, 0.95],
    haloColor: [168, 85, 247, 0.18],
    iconKind: 'factory',
    style: 'triangle',
    size: 12,
    haloSize: 28,
    iconWidth: 22,
    iconHeight: 22,
    swatch: 'rgba(168, 85, 247, 0.95)',
  },
  'delivery-point': {
    color: [236, 72, 153, 0.95],
    haloColor: [236, 72, 153, 0.18],
    iconKind: 'house',
    style: 'x',
    size: 12,
    haloSize: 28,
    iconWidth: 22,
    iconHeight: 22,
    swatch: 'rgba(236, 72, 153, 0.95)',
  },
}

function buildMultiTypeBadge(site: Site, mapTheme: MapTheme) {
  if (site.allTypes.length <= 1) return null
  const extra = site.allTypes.filter((t) => t !== site.type)
  if (extra.length === 0) return null
  const offsetX = 10
  const offsetY = 10
  return new Graphic({
    geometry: new Point({
      longitude: site.longitude,
      latitude: site.latitude,
      spatialReference: { wkid: 4326 },
    }),
    symbol: {
      type: 'text',
      text: `+${extra.length}`,
      color: mapTheme === 'dark' ? [15, 23, 42, 1] : [255, 255, 255, 1],
      haloColor: [99, 102, 241, 1],
      haloSize: 1,
      font: { size: 8, weight: 'bold', family: 'Inter' },
      xoffset: offsetX,
      yoffset: offsetY,
      backgroundColor: [99, 102, 241, 0.92],
      borderLineColor: [255, 255, 255, 0.9],
      borderLineSize: 0.8,
      padding: 3,
    } as unknown as never,
    attributes: { kind: 'site-badge', siteId: site.id, extraTypes: extra.join(',') },
  })
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

  const badge = buildMultiTypeBadge(site, mapTheme)

  if (marker.iconKind === 'factory' || marker.iconKind === 'house') {
    const base = [
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
          size: marker.haloSize ?? marker.size + 14,
          outline: { color: outlineColor, width: 1.2 },
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
          width: marker.iconWidth ?? 22,
          height: marker.iconHeight ?? 22,
        },
        attributes: baseAttributes,
        popupTemplate,
      }),
    ]
    return badge ? [...base, badge] : base
  }

  const base = [
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
  return badge ? [...base, badge] : base
}

export function getSiteIconUrl(siteType: SiteType, _mapTheme: MapTheme) {
  if (siteType === 'marketer') return getFactoryIcon()
  if (siteType === 'delivery-point') return getHouseIcon()
  if (siteType === 'depot') return lpgTankIconUrl
  // scdp and filling-center share the LPG sphere asset — halo color/size distinguishes them
  // filling-center (centre emplisseur) uses the provided sphere image as requested
  return lpgSphereIconUrl
}

export function getFactoryIcon(): string {
  // Purple factory — tinted to marketer swatch
  return svgToDataUri(factorySvgRaw.replace(/#000000/g, '#a855f7'))
}

export function getHouseIcon(): string {
  return svgToDataUri(houseSvgRaw.replace(/#000000/g, '#ec4899'))
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
  const typeLine =
    site.allTypes.length > 1
      ? site.allTypes.map((t) => siteTypeLabels[t]).join(' + ')
      : siteTypeLabels[site.type]
  const multiNote =
    site.allTypes.length > 1
      ? popupLine('Fonctions', site.functions.join(', ') || site.allTypes.join(', '))
      : ''
  return `
    <div class="fleet-truck-popup" data-popup-theme="${mapTheme}">
      ${popupLine('Type', typeLine)}
      ${multiNote}
      ${popupLine('Operateur', site.operator)}
      ${popupLine('Ville', site.city)}
      ${popupLine('Region', site.region)}
      ${popupLine('Statut', siteStatusLabels[site.status])}
      ${popupLine('Role', site.description)}
    </div>
  `
}

export function popupLine(label: string, value: string | undefined) {
  return `
    <p class="fleet-truck-popup__row">
      <strong>${label}</strong>
      <span>${escapePopupValue(value ?? '—')}</span>
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
