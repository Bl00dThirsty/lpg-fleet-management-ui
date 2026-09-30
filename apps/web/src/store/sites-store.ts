import { create } from 'zustand'
import { api } from '@lpg/api-client'
import { isHydrationFresh } from '@/lib/hydration'
import type { Site } from '@lpg/types'

interface SitesState {
  sites: Site[]
  loading: boolean
  error: string | null
  hasLoaded: boolean
  lastFetchedAt: number
  fetchSites: () => Promise<void>
}

export const useSitesStore = create<SitesState>()((set, get) => ({
  sites: [],
  loading: false,
  error: null,
  hasLoaded: false,
  lastFetchedAt: 0,
  async fetchSites() {
    if (sitesInflight) return sitesInflight
    if (get().hasLoaded && isHydrationFresh(get().lastFetchedAt)) return
    sitesInflight = (async () => {
      set({ loading: true, error: null })
      try {
        const res = await api.sites.list()
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
        set({ sites: list as Site[], loading: false, hasLoaded: true, lastFetchedAt: Date.now() })
      } catch {
        set({ loading: false, error: 'Sites indisponibles' })
      } finally {
        sitesInflight = null
      }
    })()
    return sitesInflight
  },
}))
let sitesInflight: Promise<void> | null = null
