import { create } from 'zustand'
import { api } from '@lpg/api-client'
import { isHydrationFresh } from '@/lib/hydration'
import type { Anomaly } from '@lpg/types'

interface AnomaliesState {
  anomalies: Anomaly[]
  loading: boolean
  error: string | null
  hasLoaded: boolean
  lastFetchedAt: number
  fetchAnomalies: () => Promise<void>
}

export const useAnomaliesStore = create<AnomaliesState>()((set, get) => ({
  anomalies: [],
  loading: false,
  error: null,
  hasLoaded: false,
  lastFetchedAt: 0,
  async fetchAnomalies() {
    if (anomaliesInflight) return anomaliesInflight
    if (get().hasLoaded && isHydrationFresh(get().lastFetchedAt)) return
    anomaliesInflight = (async () => {
      set({ loading: true, error: null })
      try {
        const res = await api.anomalies.list()
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
        set({ anomalies: list as Anomaly[], loading: false, hasLoaded: true, lastFetchedAt: Date.now() })
      } catch {
        set({ loading: false, error: 'Anomalies indisponibles' })
      } finally {
        anomaliesInflight = null
      }
    })()
    return anomaliesInflight
  },
}))
let anomaliesInflight: Promise<void> | null = null
