import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from '@/config/rbac/roles'

export type NotificationGroup = {
  id: string
  name: string
  targetRoles: Role[]
  createdBy: string
  createdAt: number
}

type NotificationGroupsState = {
  items: NotificationGroup[]
  addGroup: (g: Omit<NotificationGroup, 'id' | 'createdAt'>) => void
  updateGroup: (id: string, data: Partial<Omit<NotificationGroup, 'id' | 'createdAt' | 'createdBy'>>) => void
  deleteGroup: (id: string) => void
}

export const useNotificationGroupsStore = create<NotificationGroupsState>()(
  persist(
    (set) => ({
      items: [],

      addGroup: (g) =>
        set((s) => ({
          items: [
            ...s.items,
            {
              ...g,
              id: crypto.randomUUID(),
              createdAt: Date.now(),
            },
          ],
        })),

      updateGroup: (id, data) =>
        set((s) => ({
          items: s.items.map((g) => (g.id === id ? { ...g, ...data } : g)),
        })),

      deleteGroup: (id) =>
        set((s) => ({
          items: s.items.filter((g) => g.id !== id),
        })),
    }),
    {
      name: 'lpg-notification-groups',
      partialize: (state) => ({ items: state.items }),
    },
  ),
)

export function getGroupById(id: string): NotificationGroup | undefined {
  return useNotificationGroupsStore.getState().items.find((g) => g.id === id)
}

export function getGroupsByRoles(roles: Role[]): NotificationGroup[] {
  return useNotificationGroupsStore
    .getState()
    .items.filter((g) => g.targetRoles.some((r) => roles.includes(r)))
}
