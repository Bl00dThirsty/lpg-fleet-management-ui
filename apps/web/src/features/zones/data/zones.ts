import { curated } from '@lpg/mock-data'
import type {
  ClientSite as CuratedClientSite,
  Region,
  Site as CuratedSite,
} from '@lpg/types'

export interface ZoneView {
  id: string
  code: Region
  name: string
  siteCount: number
  clientSiteCount: number
  region: Region
}

export function getZones(): ZoneView[] {
  const sites = curated.sites as CuratedSite[]
  const clientSites = curated.client_sites as CuratedClientSite[]

  return curated.regions.map((region) => {
    const code = region.code as Region
    return {
      id: region.id,
      code,
      name: region.name,
      siteCount: sites.filter((s) => s.region === code).length,
      clientSiteCount: clientSites.filter((s) => s.region === code).length,
      region: code,
    }
  })
}

export function getZoneOptions(): { label: string; value: string }[] {
  return curated.regions.map((region) => ({
    label: region.name,
    value: region.code as Region,
  }))
}
