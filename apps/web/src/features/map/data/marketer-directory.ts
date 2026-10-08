import { useQuery } from '@tanstack/react-query'
import { api, type AuthUser } from '@lpg/api-client'
import type { Organization, Site, ClientSite } from '@lpg/types'
import { useAuthStore } from '@/store/auth-store'
import { getScope } from '@/features/scope/scope'
export function mapCoordinates(
  geo: Site['geo_point']
): [number, number] | null {
  if (
    !geo ||
    geo.length < 2 ||
    !Number.isFinite(geo[0]) ||
    !Number.isFinite(geo[1]) ||
    Math.abs(geo[0]) > 180 ||
    Math.abs(geo[1]) > 90
  )
    return null
  return [geo[0], geo[1]]
}
export function buildMarketerDirectory(
  organizations: Organization[],
  sites: Site[],
  clients: ClientSite[],
  user: AuthUser | null
) {
  if (!user) return []
  const scope = getScope(user)
  const staff = scope.view === 'org' && user.org_type === 'REGULATEUR'
  const visibleSites = sites.filter(
    (site) =>
      !site.deleted_at &&
      site.is_active &&
      (staff || scope.siteIds.includes(site.id) || site.created_by === user.id)
  )
  return organizations
    .filter(
      (org) =>
        !org.deleted_at &&
        org.type === 'MARKETEUR' &&
        (staff ||
          org.id === user.org_id ||
          visibleSites.some((site) => site.org_id === org.id))
    )
    .map((org) => {
      const locations = visibleSites.filter((site) => site.org_id === org.id)
      const deliveries = clients.filter(
        (site) =>
          !site.deleted_at &&
          site.is_active &&
          site.current_marketeur_org_id === org.id &&
          (staff ||
            scope.siteIds.includes(site.id) ||
            site.created_by === user.id ||
            (scope.view === 'site' && org.id === user.org_id))
      )
      return {
        organization: org,
        locations,
        deliveries,
        coordinates:
          locations
            .map((site) => mapCoordinates(site.geo_point))
            .find(Boolean) ?? null,
      }
    })
    .sort((a, b) =>
      a.organization.name.localeCompare(b.organization.name, 'fr')
    )
}
export type MarketerMapEntry = ReturnType<typeof buildMarketerDirectory>[number]
export function useMarketerDirectory() {
  const user = useAuthStore((s) => s.user)
  return useQuery({
    queryKey: ['organizations', 'map-directory', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [organizations, sites, clients] = await Promise.all([
        api.organizations.list({ size: 200 }),
        api.sites.list({ size: 200 }),
        api.clientSites.list({ size: 200 }),
      ])
      return buildMarketerDirectory(
        organizations.data as Organization[],
        sites.data as Site[],
        clients.data as ClientSite[],
        user
      )
    },
  })
}
