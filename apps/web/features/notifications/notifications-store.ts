import { create } from 'zustand'
import type { Role } from '@/config/rbac/roles'

const now = Date.now()

export type NotificationLevel = 'info' | 'success' | 'warning' | 'error'

export type AppNotification = {
  id: string
  title: string
  body: string
  ts: number
  level: NotificationLevel
  read: boolean
  role?: Role
}

type NotificationsState = {
  items: AppNotification[]
  markRead: (id: string) => void
  markAllRead: () => void
  addNotification: (
    n: Omit<AppNotification, 'id' | 'read' | 'ts' | 'role'> & { ts?: number; role?: Role }
  ) => void
}

const seed: AppNotification[] = [
  {
    id: 'n1',
    title: 'Nouveau rapport de conformité',
    body: 'Rapport mensuel de traçabilité disponible.',
    ts: now - 1000 * 60 * 5,
    level: 'info',
    read: false,
    role: 'SUPER_ADMIN',
  },
  {
    id: 'n2',
    title: 'Nouvel utilisateur en attente',
    body: 'Un nouveau marketeur demande accès à la plateforme.',
    ts: now - 1000 * 60 * 42,
    level: 'info',
    read: false,
    role: 'ADMIN',
  },
  {
    id: 'n3',
    title: 'Nouvelle tournée assignée',
    body: 'Tournée TRP-2404 planifiée pour Tradex.',
    ts: now - 1000 * 60 * 90,
    level: 'info',
    read: true,
    role: 'MARKETEUR',
  },
  {
    id: 'n4',
    title: 'Mission de livraison prête',
    body: '6 arrêts programmés pour aujourd\'hui.',
    ts: now - 1000 * 60 * 180,
    level: 'info',
    read: true,
    role: 'LIVREUR',
  },
]

export const useNotificationsStore = create<NotificationsState>((set) => ({
  items: seed,
  markRead: (id) =>
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllRead: () =>
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })) })),
  addNotification: (n) =>
    set((s) => ({
      items: [
        {
          ...n,
          id: crypto.randomUUID(),
          ts: n.ts ?? Date.now(),
          read: false,
        },
        ...s.items,
      ],
    })),
}))

export const selectUnreadCount = (s: NotificationsState) =>
  s.items.filter((n) => !n.read).length

export function getNotificationsForRole(role: string): AppNotification[] {
  const items = useNotificationsStore.getState().items
  if (role === 'SUPER_ADMIN') return items
  return items.filter((n) => !n.role || n.role === role)
}
