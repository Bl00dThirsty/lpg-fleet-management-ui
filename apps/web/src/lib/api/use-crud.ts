/**
 * Generic CRUD data-access layer over `@lpg/api-client`.
 *
 * Every write goes through `api.<resource>` (the adapter) — never a direct
 * `curated` mutation. The fake adapter (in `api-client`) now supports
 * POST/PATCH/DELETE against its in-memory collections, so this works today
 * and transparently against the Spring backend once `VITE_API_MODE=http`.
 *
 * Reads + cache invalidation use React Query, matching the existing
 * `lib/api/use-resources.ts` convention. This is the single data-source of
 * truth for list pages — no second Zustand mirror.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@lpg/api-client'
import type { Resource } from '@lpg/permissions'

type ApiResources = typeof api

/** Union of every api resource that exposes create/patch/remove. */
export type CrudResource = {
  [K in keyof ApiResources]: ApiResources[K] extends {
    create: (...a: never[]) => unknown
    patch: (...a: never[]) => unknown
    remove: (...a: never[]) => unknown
  }
    ? K
    : never
}[keyof ApiResources]

export interface UseCrudOptions {
  /** Permission resource used for gating (may differ from the api key). */
  permissionResource?: Resource
  /** React Query key prefix for cache invalidation. */
  queryKey?: string[]
}

export function useCrud<T extends { id: string }>(
  resource: CrudResource,
  options: UseCrudOptions = {},
) {
  const qc = useQueryClient()
  const baseKey = options.queryKey ?? [resource as string]

  const list = useQuery<T[]>({
    queryKey: [...baseKey, 'list'],
    // List pages paginate client-side (TanStack); fetch the full collection in
    // one page. The fake adapter and mock server cap `limit` at 100, which
    // covers every fixture collection today.
    queryFn: () => api[resource].list({ limit: 100 } as never).then((r) => r.data as T[]),
  })

  const createMut = useMutation<T, Error, Partial<T>>({
    mutationFn: (body) => api[resource].create(body as Omit<T, 'id'>),
    onSuccess: () => qc.invalidateQueries({ queryKey: baseKey }),
  })

  const updateMut = useMutation<T, Error, { id: string; patch: Partial<T> }>({
    mutationFn: ({ id, patch }) => api[resource].patch(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: baseKey }),
  })

  const removeMut = useMutation<void, Error, string>({
    mutationFn: (id) => api[resource].remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: baseKey }),
  })

  return { list, createMut, updateMut, removeMut }
}
