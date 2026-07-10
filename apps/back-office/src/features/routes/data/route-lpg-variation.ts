import { type RouteTripView } from './routes'

export type RouteLpgVariationStageId = 'loading' | 'live' | 'projected'

export type RouteLpgVariationStageTone = 'emerald' | 'sky' | 'amber'

export type RouteLpgVariationStage = {
  id: RouteLpgVariationStageId
  label: string
  quantityKg: number
  percent: number
  deltaKg: number
  deltaPercent: number
  tone: RouteLpgVariationStageTone
}

export type RouteLpgVariation = {
  stages: RouteLpgVariationStage[]
  deliveredKg: number
  deliveredPercent: number
  nextDropKg: number
  telemetryGapKg: number
}

export function buildRouteLpgVariation(
  trip: RouteTripView
): RouteLpgVariation {
  const loadingKg = trip.loadedQuantityKg
  const liveKg = trip.latestTelemetry.estimatedVolumeKg
  const nextDropKg =
    trip.status === 'completed' ? 0 : (trip.nextStop.deliveredQuantityKg ?? 0)
  const projectedKg =
    trip.status === 'completed' ? liveKg : Math.max(liveKg - nextDropKg, 0)

  return {
    stages: [
      {
        id: 'loading',
        label: 'Au chargement',
        quantityKg: loadingKg,
        percent: 100,
        deltaKg: 0,
        deltaPercent: 0,
        tone: 'emerald',
      },
      {
        id: 'live',
        label: 'Dernier releve',
        quantityKg: liveKg,
        percent: toPercent(liveKg, loadingKg),
        deltaKg: liveKg - loadingKg,
        deltaPercent: toPercent(liveKg, loadingKg) - 100,
        tone: 'sky',
      },
      {
        id: 'projected',
        label:
          trip.status === 'completed'
            ? 'Niveau final'
            : 'Apres prochaine livraison',
        quantityKg: projectedKg,
        percent: toPercent(projectedKg, loadingKg),
        deltaKg: projectedKg - liveKg,
        deltaPercent:
          toPercent(projectedKg, loadingKg) - toPercent(liveKg, loadingKg),
        tone: 'amber',
      },
    ],
    deliveredKg: trip.deliveredQuantityKg,
    deliveredPercent: trip.deliveredPercent,
    nextDropKg,
    telemetryGapKg: Math.abs(liveKg - trip.remainingQuantityKg),
  }
}

function toPercent(quantityKg: number, loadedQuantityKg: number) {
  if (loadedQuantityKg <= 0) return 0

  return Math.max(Math.round((quantityKg / loadedQuantityKg) * 100), 0)
}
