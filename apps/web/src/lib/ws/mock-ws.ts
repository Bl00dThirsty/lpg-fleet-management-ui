export interface WsEventDetail {
  event: string
  payload?: unknown
  /** Id of the acting user, when the event was self-triggered (own mutations). */
  actorId?: string
}

export function emitWs(event: string, payload?: unknown, actorId?: string): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('ws:event', { detail: { event, payload, actorId } }),
  )
}
