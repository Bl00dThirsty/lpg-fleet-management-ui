import { describe, it, expect } from 'vitest'
import { getGeoAnomalies } from './geo-anomalies'

describe('getGeoAnomalies', () => {
  it('returns one entry per anomaly that resolves to a geo_point', () => {
    const anomalies = getGeoAnomalies()
    expect(Array.isArray(anomalies)).toBe(true)
    for (const a of anomalies) {
      expect(typeof a.id).toBe('string')
      expect(typeof a.latitude).toBe('number')
      expect(typeof a.longitude).toBe('number')
      expect(['INVESTIGATION', 'TECHNICAL']).toContain(a.category)
    }
  })

  it('drops anomalies without a resolvable geo_point', () => {
    const anomalies = getGeoAnomalies()
    expect(
      anomalies.every(
        (a) =>
          Number.isFinite(a.latitude) && Number.isFinite(a.longitude),
      ),
    ).toBe(true)
  })
})
