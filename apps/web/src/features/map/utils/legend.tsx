import type { SiteType } from '@/features/sites/data/sites'
import { getSiteIconUrl, siteMarkerTokens } from '@/features/sites/utils/site-graphics'
import { rgbaFromTuple } from './map-theme'
import type { MapTheme } from './map-theme'

export function LegendSiteIcon({
  type,
  mapTheme,
}: {
  type: SiteType
  mapTheme: MapTheme
}) {
  const marker = siteMarkerTokens[type]
  return (
    <span
      className='flex size-6 items-center justify-center rounded-full'
      style={{ backgroundColor: rgbaFromTuple(marker.haloColor) }}
    >
      <img
        src={getSiteIconUrl(type, mapTheme)}
        alt=''
        className='max-h-4 max-w-4 object-contain'
      />
    </span>
  )
}
