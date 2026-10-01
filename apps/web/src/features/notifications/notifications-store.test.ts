import { describe, expect, it } from 'vitest'
import { useNotificationsStore, selectUnreadCount } from './notifications-store'

describe('notifications store', () => {
  it('seeds with some unread items', () => {
    const state = useNotificationsStore.getState()
    expect(state.items.length).toBeGreaterThan(0)
    expect(selectUnreadCount(state)).toBeGreaterThan(0)
  })

  it('markRead marks a single item read', () => {
    const id = useNotificationsStore.getState().items[0]!.id
    useNotificationsStore.getState().markRead(id)
    const updated = useNotificationsStore.getState().items.find((n) => n.id === id)
    expect(updated?.read).toBe(true)
  })

  it('markAllRead clears all unread', () => {
    useNotificationsStore.getState().markAllRead()
    expect(selectUnreadCount(useNotificationsStore.getState())).toBe(0)
  })
})
