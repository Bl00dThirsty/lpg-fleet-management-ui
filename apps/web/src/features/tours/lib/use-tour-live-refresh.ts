import { useEffect } from 'react'
import { getSettingNumber } from '@lpg/mock-data'
import { useToursStore } from '@/store/tours-store'

export function getTourLiveRefreshIntervalMs(): number {
  const seconds =
    getSettingNumber('tournee.live_refresh_interval_seconds') ?? 5
  return Math.max(1000, seconds * 1000)
}

export function triggerTourLiveRefresh(tourId?: string): void {
  void useToursStore.getState().fetchTours(true, true)
  if (tourId) {
    void useToursStore.getState().fetchCheckpoints(tourId, true, true)
  }
}

/**
 * Settings-driven auto-refresh hook for tour monitoring screens.
 * Automatically polls tours and active tour checkpoints in the background
 * without triggering loading flickers, keeping the UI in sync with PDA execution.
 */
export function useTourLiveRefresh(tourId?: string, enabled = true): void {
  useEffect(() => {
    if (!enabled) return

    const intervalMs = getTourLiveRefreshIntervalMs()

    const timer = setInterval(() => {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState !== 'visible'
      ) {
        return
      }

      triggerTourLiveRefresh(tourId)
    }, intervalMs)

    return () => clearInterval(timer)
  }, [tourId, enabled])
}
