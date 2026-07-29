import { describe, expect, it } from 'vitest'
import { buildRouteLpgVariation } from './route-lpg-variation'
import { getRouteTripsView } from './routes'

describe('buildRouteLpgVariation', () => {
  it('builds the loading, live, and projected LPG stages for an active trip', () => {
    const trip = getRouteTripsView()[0]
    const variation = buildRouteLpgVariation(trip)

    expect(variation.stages.map((stage) => stage.label)).toEqual([
      'Au chargement',
      'Dernier releve',
      'Apres prochaine livraison',
    ])
    expect(variation.stages[0]).toMatchObject({
      quantityKg: 18500,
      percent: 100,
      deltaKg: 0,
    })
    expect(variation.stages[1]).toMatchObject({
      quantityKg: 12450,
      percent: 67,
      deltaKg: -6050,
      deltaPercent: -33,
    })
    expect(variation.stages[2]).toMatchObject({
      quantityKg: 0,
      percent: 0,
      deltaKg: -12450,
    })
    expect(variation.deliveredKg).toBe(6050)
    expect(variation.deliveredPercent).toBe(33)
    expect(variation.nextDropKg).toBe(12450)
    expect(variation.telemetryGapKg).toBe(0)
  })

  it('keeps the live level as final level once the trip is completed', () => {
    const trip = getRouteTripsView().find(
      (candidate) => candidate.id === 'route-trip-douala-bonamoussadi'
    )

    expect(trip).toBeTruthy()

    const variation = buildRouteLpgVariation(trip!)

    expect(variation.stages[2]).toMatchObject({
      label: 'Niveau final',
      quantityKg: 150,
      percent: 1,
      deltaKg: 0,
      deltaPercent: 0,
    })
    expect(variation.nextDropKg).toBe(0)
  })
})
