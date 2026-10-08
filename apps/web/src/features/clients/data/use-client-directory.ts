import { useQuery } from '@tanstack/react-query'
import { api } from '@lpg/api-client'
import type { Client, ClientSite, Organization } from '@lpg/types'
import { useAuthStore } from '@/store/auth-store'

/** List and detail share the same authenticated, server-backed directory. */
export function useClientDirectory() {
  const user = useAuthStore((s) => s.user)
  const clients = useQuery({
    queryKey: ['clients', 'directory', user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await api.clients.list({ size: 200 })).data as Client[],
  })
  const organizations = useQuery({
    queryKey: ['organizations', 'client-directory', user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await api.organizations.list({ size: 200 })).data as Organization[],
  })
  const sites = useQuery({
    queryKey: ['client-sites', 'directory', user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await api.clientSites.list({ size: 200 })).data as ClientSite[],
  })
  const rows = (clients.data ?? []).filter(
    (client) =>
      user?.org_type === 'REGULATEUR' ||
      client.created_by === user?.id ||
      sites.data?.some(
        (site) =>
          !site.deleted_at &&
          site.client_org_id === client.org_id &&
          site.current_marketeur_org_id === user?.org_id
      )
  )
  return {
    clients: rows,
    organizations: organizations.data ?? [],
    sites: sites.data ?? [],
    isLoading: clients.isPending || organizations.isPending || sites.isPending,
    isError: clients.isError || organizations.isError || sites.isError,
    refetch: () =>
      Promise.all([
        clients.refetch(),
        organizations.refetch(),
        sites.refetch(),
      ]),
  }
}
