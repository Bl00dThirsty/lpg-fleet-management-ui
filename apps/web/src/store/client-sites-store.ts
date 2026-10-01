import { create } from 'zustand'
import { api } from '@lpg/api-client'
import { isHydrationFresh } from '@/lib/hydration'
import type { ClientSite } from '@lpg/types'

interface ClientSitesState {
  clientSites: ClientSite[]
  loading: boolean
  error: string | null
  hasLoaded: boolean
  lastFetchedAt: number
  fetchClientSites: () => Promise<void>
}

export const useClientSitesStore = create<ClientSitesState>()((set, get) => ({
  clientSites: [],
  loading: false,
  error: null,
  hasLoaded: false,
  lastFetchedAt: 0,
  async fetchClientSites() {
    if (clientSitesInflight) return clientSitesInflight
    if (get().hasLoaded && isHydrationFresh(get().lastFetchedAt)) return
    clientSitesInflight = (async () => {
      set({ loading: true, error: null })
      try {
        const res = await api.clientSites.list()
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
        set({ clientSites: list as ClientSite[], loading: false, hasLoaded: true, lastFetchedAt: Date.now() })
      } catch {
        set({ loading: false, error: 'Client sites indisponibles' })
      } finally {
        clientSitesInflight = null
      }
    })()
    return clientSitesInflight
  },
}))
let clientSitesInflight: Promise<void> | null = null
