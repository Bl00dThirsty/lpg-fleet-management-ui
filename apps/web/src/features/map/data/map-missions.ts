import { useEffect, useMemo } from 'react'
import type { DeliveryTour, Checkpoint, Site, ClientSite } from '@lpg/types'
import { useAuthStore } from '@/store/auth-store'
import { useToursStore } from '@/store/tours-store'
import { useSitesStore } from '@/store/sites-store'
import { useClientSitesStore } from '@/store/client-sites-store'
import { useTourLiveRefresh } from '@/features/tours/lib/use-tour-live-refresh'
import { canSeeMapMission } from '../lib/mission-filters'
import { mapCoordinates } from './marketer-directory'
import { useRoadRoutes } from './road-routes'
export interface MapMission {
  tour: DeliveryTour
  stops: Array<{
    id: string
    name: string
    coordinates: [number, number] | null
  }>
  missingCoordinates: boolean
}
export interface MapMissionRoute extends MapMission {
  paths: [number, number][][]
  roadStatus: 'pending' | 'error' | 'success'
}
export function buildMapMission(
  tour: DeliveryTour,
  checkpoints: Checkpoint[],
  sites: Site[],
  clients: ClientSite[]
): MapMission {
  const ordered = checkpoints
    .filter((cp) => !cp.deleted_at)
    .sort((a, b) => a.sequence - b.sequence)
  const stops = ordered.map((cp) => {
    const site = cp.client_site_id
      ? clients.find((site) => site.id === cp.client_site_id)
      : sites.find((site) => site.id === cp.site_id)
    // The dispatch API enriches checkpoints with the destination's coordinates.
    const enriched = cp as Checkpoint & {
      latitude?: number
      longitude?: number
      site_name?: string
      name?: string
    }
    const coordinates =
      mapCoordinates(site?.geo_point) ??
      (typeof enriched.longitude === 'number' &&
      typeof enriched.latitude === 'number'
        ? mapCoordinates([enriched.longitude, enriched.latitude])
        : null)
    return {
      id: cp.id,
      name:
        site?.name ??
        enriched.site_name ??
        enriched.name ??
        'Étape ' + cp.sequence,
      coordinates,
    }
  })
  return {
    tour,
    stops,
    missingCoordinates:
      stops.length < 2 || stops.some((stop) => !stop.coordinates),
  }
}
export function useMapMissions() {
  const user = useAuthStore((s) => s.user)
  const tours = useToursStore((s) => s.tours)
  const checkpoints = useToursStore((s) => s.checkpoints)
  const loading = useToursStore((s) => s.loading)
  const loaded = useToursStore((s) => s.hasLoaded)
  const error = useToursStore((s) => s.error)
  const sites = useSitesStore((s) => s.sites)
  const clients = useClientSitesStore((s) => s.clientSites)
  const userId = user?.id
  useEffect(() => {
    if (userId) void useToursStore.getState().fetchTours(true)
  }, [userId])
  useTourLiveRefresh(undefined, !!user)
  const missions = useMemo(
    () =>
      tours
        .filter((tour) => canSeeMapMission(tour, user))
        .map((tour) =>
          buildMapMission(
            tour,
            tour.checkpoints ??
              checkpoints.filter(
                (cp) => (cp.tournee_id ?? cp.tour_id) === tour.id
              ),
            sites,
            clients
          )
        ),
    [tours, checkpoints, sites, clients, user]
  )
  return {
    missions,
    loading: !loaded || loading,
    error,
    retry: () => useToursStore.getState().fetchTours(true),
  }
}
export function useMissionRoadRoutes(
  missions: MapMission[]
): MapMissionRoute[] {
  const routable = missions.filter((mission) => !mission.missingCoordinates)
  const keys = routable.map((mission) =>
    JSON.stringify(mission.stops.map((stop) => stop.coordinates!))
  )
  const uniqueKeys = [...new Set(keys)]
  const results = useRoadRoutes(
    uniqueKeys.map((key) => ({ stops: JSON.parse(key) as [number, number][] }))
  )
  return missions.map((mission) => {
    const routeIndex = routable.findIndex(
      (row) => row.tour.id === mission.tour.id
    )
    const result = results[uniqueKeys.indexOf(keys[routeIndex] ?? '')]
    return {
      ...mission,
      paths: result?.data?.paths ?? [],
      roadStatus: result?.status ?? 'error',
    }
  })
}
