/**
 * Convenience wiring for a CRUD feature page: combines the React Query
 * `useCrud` data layer, permission gating, and create/edit sheet state so a
 * page only declares its config + columns.
 */

import { useState } from 'react'
import type { Resource } from '@lpg/permissions'
import { useCrud, type CrudResource } from '@/lib/api/use-crud'
import { useEntityPermission } from '@/lib/permissions/use-entity-permission'

export function useEntityCrud<T extends { id: string }>(
  resource: CrudResource,
  permissionResource: Resource,
  queryKey?: string[],
) {
  const crud = useCrud<T>(resource, { permissionResource, queryKey })
  const perm = useEntityPermission(permissionResource)
  const [editing, setEditing] = useState<T | null>(null)
  const [creating, setCreating] = useState(false)

  return {
    ...crud,
    perm,
    editing,
    creating,
    openCreate: () => setCreating(true),
    openEdit: (entity: T) => setEditing(entity),
    close: () => {
      setEditing(null)
      setCreating(false)
    },
  }
}
