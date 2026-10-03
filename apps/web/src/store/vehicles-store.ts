import { create } from 'zustand'
import { api } from '@lpg/api-client'
import { isHydrationFresh } from '@/lib/hydration'
import type { Vehicle } from '@lpg/types'

interface VehiclesState {
  vehicles: Vehicle[]
  loading: boolean
  error: string | null
  hasLoaded: boolean
  lastFetchedAt: number
  fetchVehicles: () => Promise<void>
}

export const useVehiclesStore = create<VehiclesState>()((set, get) => ({
  vehicles: [],
  loading: false,
  error: null,
  hasLoaded: false,
  lastFetchedAt: 0,
  async fetchVehicles() {
    if (vehiclesInflight) return vehiclesInflight
    if (get().hasLoaded && isHydrationFresh(get().lastFetchedAt)) return
    vehiclesInflight = (async () => {
      set({ loading: true, error: null })
      try {
        const res = await api.vehicles.list()
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
        set({ vehicles: list as Vehicle[], loading: false, hasLoaded: true, lastFetchedAt: Date.now() })
      } catch {
        set({ loading: false, error: 'Vehicles indisponibles' })
      } finally {
        vehiclesInflight = null
      }
    })()
    return vehiclesInflight
  },
}))
let vehiclesInflight: Promise<void> | null = null
