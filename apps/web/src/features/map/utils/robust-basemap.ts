import Basemap from '@arcgis/core/Basemap.js'
import WebTileLayer from '@arcgis/core/layers/WebTileLayer.js'
import type { MapTheme } from './map-theme'

/**
 * Construit un fond de carte (Basemap) ultra-fiable et autonome,
 * fonctionnant sans clé API ArcGIS et sans restrictions de domaine (CORS / 403 sur Vercel).
 * - Light : OpenStreetMap standard (tuiles rapides et nettes)
 * - Dark : CartoDB Dark Matter (cartographie sombre haute précision)
 */
export function createRobustBasemap(theme: MapTheme = 'light'): Basemap {
  if (theme === 'dark') {
    return new Basemap({
      id: 'carto-dark-matter',
      title: 'Dark Theme',
      baseLayers: [
        new WebTileLayer({
          urlTemplate:
            'https://{subDomain}.basemaps.cartocdn.com/dark_all/{level}/{col}/{row}.png',
          subDomains: ['a', 'b', 'c', 'd'],
          copyright: '© OpenStreetMap contributors, © CARTO',
        }),
      ],
    })
  }

  return new Basemap({
    id: 'osm-standard',
    title: 'OpenStreetMap',
    baseLayers: [
      new WebTileLayer({
        urlTemplate: 'https://tile.openstreetmap.org/{level}/{col}/{row}.png',
        copyright: '© OpenStreetMap contributors',
      }),
    ],
  })
}
