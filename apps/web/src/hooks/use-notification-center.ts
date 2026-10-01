import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { playNotificationSound, shouldPlaySound } from './use-notification-sound'

/**
 * Drives the notification bell off WebSocket events (`ws:notify`), so an
 * `anomaly:new`/`tour:update` pushed by the server (or emitted by the mock
 * WS service) increments the unread badge and plays a short sound.
 * Events tagged with the acting user's own id (self-triggered mutations)
 * are ignored — the bell notifies about OTHER actors' activity.
 * Opening the center clears the WS-driven counter.
 */
export function useNotificationCenter(enabled = true) {
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const actorId = useAuthStore((s) => s.user?.id)

  useEffect(() => {
    if (!enabled) return
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ event: string; actorId?: string }>).detail
      if (detail?.actorId && detail.actorId === actorId) return
      setUnread((n) => n + 1)
      if (shouldPlaySound(true)) playNotificationSound()
    }
    window.addEventListener('ws:notify', handler)
    return () => window.removeEventListener('ws:notify', handler)
  }, [enabled, actorId])

  const openCenter = useCallback(() => {
    setUnread(0)
    setOpen(true)
  }, [])

  return { unread, open, openCenter, setOpen }
}
