import { create } from 'zustand'
import { api } from '@lpg/api-client'
import { isHydrationFresh } from '@/lib/hydration'
import type { RegionEntity } from '@lpg/types'

interface RegionsState {
  regions: RegionEntity[]
  loading: boolean
  error: string | null
  hasLoaded: boolean
  lastFetchedAt: number
  fetchRegions: () => Promise<void>
}

export const useRegionsStore = create<RegionsState>()((set, get) => ({
  regions: [],
  loading: false,
  error: null,
  hasLoaded: false,
  lastFetchedAt: 0,
  async fetchRegions() {
    if (regionsInflight) return regionsInflight
    if (get().hasLoaded && isHydrationFresh(get().lastFetchedAt)) return
    regionsInflight = (async () => {
      set({ loading: true, error: null })
      try {
        const res = await api.regions.list()
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
        set({ regions: list as RegionEntity[], loading: false, hasLoaded: true, lastFetchedAt: Date.now() })
      } catch {
        set({ loading: false, error: 'Regions indisponibles' })
      } finally {
        regionsInflight = null
      }
    })()
    return regionsInflight
  },
}))
let regionsInflight: Promise<void> | null = null
