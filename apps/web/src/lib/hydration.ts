/**
 * Shared hydration freshness (Phase 3 item 3.8).
 *
 * The initial fetchUsers/fetchTours/fetchPickups hydration runs once at app
 * mount (see main.tsx `AppHydration`). Per-page `useEffect` refreshes stay in
 * place but become cheap no-ops while the data is fresh, and explicit
 * refreshes again once stale — so mount hydration + page mount never
 * produce duplicate network storms.
 */

/** Freshness window during which a store fetch is skipped as a no-op. */
export const HYDRATION_STALE_MS = 60_000

/** True when `lastFetchedAt` (epoch ms, 0 = never) is within the window. */
export function isHydrationFresh(lastFetchedAt: number, now: number = Date.now()): boolean {
  return lastFetchedAt > 0 && now - lastFetchedAt < HYDRATION_STALE_MS
}
