import { useMemo } from 'react'
import { getAllVracRoutes, type VracTourRoute } from './itineraries'
import { useQueries, type UseQueryResult } from '@tanstack/react-query'
import {
  solveRoadRoute,
  projectOnRoad,
  type RoadCoordinate,
  type RoadRoute,
} from '../lib/road-routing'

const apiKey = String(import.meta.env.VITE_ARCGIS_API_KEY ?? '').trim()

export function useRoadRoutes(
  requests: { stops: RoadCoordinate[] }[],
  enabled = true,
) {
  return useQueries({
    combine: summarizeRoutes,
    queries: requests.map(({ stops }) => ({
      queryKey: ['arcgis-road-route', stops],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        solveRoadRoute(stops, apiKey, signal),
      enabled,
      staleTime: Infinity,
      gcTime: 30 * 60 * 1000,
      retry: false,
      refetchOnWindowFocus: false,
    })),
  })
}

const vracRoutes = getAllVracRoutes()
const vracRequests = vracRoutes.map((route) => ({
  stops: [
    route.departureCoords,
    ...route.checkpoints
      .filter((stop) => stop.type === 'weighing' || stop.type === 'waypoint')
      .map((stop) => stop.coords),
    route.destinationCoords,
  ],
}))

export function useVracRoadRoutes(): VracTourRoute[] {
  const results = useRoadRoutes(vracRequests)
  return useMemo(
    () =>
      vracRoutes.map((route, index) => {
        const result = results[index]!
        const road = result.data
        return {
          ...route,
          path: road?.paths[0] ?? [],
          roadPaths: road?.paths,
          roadStatus: result.status,
          distanceKm: road
            ? Math.round(road.distanceKm * 10) / 10
            : route.distanceKm,
          estimatedDurationMin: road
            ? Math.ceil(road.durationMin)
            : route.estimatedDurationMin,
          currentPosition: road
            ? projectOnRoad(route.currentPosition, road.paths)
            : route.currentPosition,
        }
      }),
    [results],
  )
}

function summarizeRoutes(results: UseQueryResult<RoadRoute, Error>[]) {
  return results.map(({ data, status, error, isPending, isError }) => ({
    data,
    status,
    error,
    isPending,
    isError,
  }))
}
