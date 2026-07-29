import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { api } from '@lpg/api-client'
import type { ApiPagination } from '@lpg/api-client'
import type { ListResult } from '@lpg/api-client'

/** A resource service exposes list/getById/create/update/remove. */
type ResourceService<T, K extends string = string> = {
  list: (params?: Record<string, string | number>) => Promise<ListResult<T>>
  getById: (id: K) => Promise<T>
  create: (body: Omit<T, 'id'>) => Promise<T>
  update: (id: K, body: Partial<T>) => Promise<T>
  remove: (id: K) => Promise<void>
}

const RESOURCE_QUERY_KEYS: Record<string, string> = {
  organizations: 'organizations',
  users: 'users',
  sites: 'sites',
  trucks: 'trucks',
  tours: 'tours',
  declarations: 'declarations',
  anomalies: 'anomalies',
  reports: 'reports',
  pda: 'pda',
  infra: 'infra',
}

function resourceKey(name: string): string[] {
  return [RESOURCE_QUERY_KEYS[name] ?? name]
}

export interface ListParams {
  page?: number
  limite?: number
  [key: string]: string | number | undefined
}

/**
 * Generic, typed TanStack Query hooks for any resource service. Keeps the UI
 * layer free of fetch/loading/error boilerplate and gives us centralized
 * caching + invalidation keyed by resource name.
 */
export function createResourceHooks<T extends { id: string }>(
  name: string,
  service: ResourceService<T>,
) {
  const baseKey = resourceKey(name)

  function useList(params: ListParams = {}) {
    const { page = 1, limite = 20, ...filters } = params
    const queryParams: Record<string, string | number> = { page, limite, ...filters }
    return useQuery({
      queryKey: [...baseKey, 'list', params],
      queryFn: () => service.list(queryParams),
      placeholderData: keepPreviousData,
    })
  }

  function useOne(id: string | undefined) {
    return useQuery({
      queryKey: [...baseKey, 'detail', id],
      queryFn: () => service.getById(id as string),
      enabled: Boolean(id),
    })
  }

  function useCreate() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (body: Omit<T, 'id'>) => service.create(body),
      onSuccess: () => qc.invalidateQueries({ queryKey: baseKey }),
    })
  }

  function useUpdate() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: ({ id, body }: { id: string; body: Partial<T> }) =>
        service.update(id, body),
      onSuccess: ({ id }: { id: string }) => {
        qc.invalidateQueries({ queryKey: baseKey })
        qc.invalidateQueries({ queryKey: [...baseKey, 'detail', id] })
      },
    })
  }

  function useRemove() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => service.remove(id),
      onSuccess: () => qc.invalidateQueries({ queryKey: baseKey }),
    })
  }

  return { useList, useOne, useCreate, useUpdate, useRemove }
}

// Re-export the pagination shape the UI expects.
export type { ApiPagination, ListResult }

// Per-resource hook instances used by feature screens.
export const trucksHooks = createResourceHooks('trucks', api.trucks as any)
export const sitesHooks = createResourceHooks('sites', api.sites as any)
export const usersHooks = createResourceHooks('users', api.users as any)
export const organizationsHooks = createResourceHooks('organizations', api.organizations as any)
export const toursHooks = createResourceHooks('tours', api.tours as any)
export const declarationsHooks = createResourceHooks('declarations', api.declarations as any)
export const anomaliesHooks = createResourceHooks('anomalies', api.anomalies as any)
export const reportsHooks = createResourceHooks('reports', api.reports as any)
export const pdaHooks = createResourceHooks('pda', api.pda as any)
export const infraHooks = createResourceHooks('infra', api.infra as any)
export const transportersHooks = createResourceHooks('transporters', api.transporters as any)
