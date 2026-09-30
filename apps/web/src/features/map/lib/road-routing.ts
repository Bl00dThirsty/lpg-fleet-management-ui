export type RoadCoordinate = [number, number]

export interface RoadRoute {
  paths: RoadCoordinate[][]
  distanceKm: number
  durationMin: number
}

const ROUTE_URL =
  'https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World/solve'

export function orderedRoadStops(stops: RoadCoordinate[]): RoadCoordinate[] {
  return stops.filter((point, index) => {
    if (
      !Number.isFinite(point[0]) ||
      !Number.isFinite(point[1]) ||
      Math.abs(point[0]) > 180 ||
      Math.abs(point[1]) > 90
    ) {
      throw new Error('Coordonnées de trajet invalides.')
    }
    const previous = stops[index - 1]
    return !previous || point[0] !== previous[0] || point[1] !== previous[1]
  })
}

export async function solveRoadRoute(
  stops: RoadCoordinate[],
  apiKey: string,
  signal?: AbortSignal,
): Promise<RoadRoute> {
  const ordered = orderedRoadStops(stops)
  if (ordered.length < 2)
    throw new Error('Au moins deux étapes distinctes sont nécessaires.')
  if (!apiKey) throw new Error('Le calcul routier ArcGIS n’est pas configuré.')
  const response = await fetch(ROUTE_URL, {
    method: 'POST',
    signal,
    body: new URLSearchParams({
      f: 'json',
      token: apiKey,
      stops: JSON.stringify({
        features: ordered.map(([x, y]) => ({
          geometry: { x, y, spatialReference: { wkid: 4326 } },
        })),
      }),
      outSR: '4326',
      outputLines: 'esriNAOutputLineTrueShape',
      findBestSequence: 'false',
      returnDirections: 'false',
      returnRoutes: 'true',
      ignoreInvalidLocations: 'false',
    }),
  })
  if (!response.ok)
    throw new Error('Le service de calcul routier est indisponible.')
  const result = await response.json()
  if (result.error) {
    throw new Error(
      'Calcul routier indisponible. Vérifiez l’accès ArcGIS au service de routage.',
    )
  }
  const route = result.routes?.features?.[0]
  const paths: unknown = route?.geometry?.paths
  if (
    !Array.isArray(paths) ||
    !paths.length ||
    paths.some(
      (path) =>
        !Array.isArray(path) ||
        path.length < 2 ||
        path.some(
          (point: unknown) =>
            !Array.isArray(point) ||
            point.length < 2 ||
            !Number.isFinite(point[0]) ||
            !Number.isFinite(point[1]) ||
            Math.abs(point[0]) > 180 ||
            Math.abs(point[1]) > 90,
        ),
    )
  ) {
    throw new Error('Aucun itinéraire routier trouvé pour ces étapes.')
  }
  const distanceKm = route.attributes?.Total_Kilometers
  const durationMin =
    route.attributes?.Total_TravelTime ?? route.attributes?.Total_Minutes
  if (
    !Number.isFinite(distanceKm) ||
    distanceKm < 0 ||
    !Number.isFinite(durationMin) ||
    durationMin < 0
  ) {
    throw new Error('Le service a retourné un itinéraire incomplet.')
  }
  return { paths: paths as RoadCoordinate[][], distanceKm, durationMin }
}

/** Display-only projection for simulated positions; never alters stored GPS data. */
export function projectOnRoad(
  point: RoadCoordinate,
  paths: RoadCoordinate[][],
): RoadCoordinate {
  const scale = Math.cos((point[1] * Math.PI) / 180)
  let nearest = point
  let minimum = Infinity
  for (const path of paths) {
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1]!
      const b = path[i]!
      const dx = (b[0] - a[0]) * scale
      const dy = b[1] - a[1]
      const length = dx * dx + dy * dy
      const t = length
        ? Math.max(
            0,
            Math.min(
              1,
              ((point[0] - a[0]) * scale * dx + (point[1] - a[1]) * dy) /
                length,
            ),
          )
        : 0
      const candidate: RoadCoordinate = [
        a[0] + t * (b[0] - a[0]),
        a[1] + t * dy,
      ]
      const distance =
        ((candidate[0] - point[0]) * scale) ** 2 +
        (candidate[1] - point[1]) ** 2
      if (distance < minimum) {
        minimum = distance
        nearest = candidate
      }
    }
  }
  return nearest
}
