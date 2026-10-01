import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { invalidateResource } from '@/lib/api/invalidation'

const EVENT_TO_RESOURCES: Record<string, string[]> = {
  'tour:update': ['tours'],
  'pickup:update': ['pickups'],
  'anomaly:new': ['anomalies'],
  'anomaly:assigned': ['anomalies'],
  'device:telemetry': ['devices'],
  'contract:update': ['transporter-contracts'],
}

export function mapWsEventToInvalidation(event: string): string[] {
  return EVENT_TO_RESOURCES[event] ?? []
}

export function useWsClient(enabled = false): void {
  const qc = useQueryClient()

  useEffect(() => {
    if (!enabled) return
    // In dev/mock, a MockWsService (see Task 4) dispatches window CustomEvents.
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ event: string; payload?: unknown; actorId?: string }>).detail
      if (!detail?.event) return
      for (const resource of mapWsEventToInvalidation(detail.event)) {
        invalidateResource(qc, resource)
      }
      // Notify the notification center with a DISTINCT event type so this
      // handler does not re-enter itself (plan-mandated code re-dispatched
      // 'ws:event', causing infinite recursion → stack overflow).
      window.dispatchEvent(new CustomEvent('ws:notify', { detail }))
    }
    window.addEventListener('ws:event', handler)
    return () => window.removeEventListener('ws:event', handler)
  }, [enabled, qc])
}
