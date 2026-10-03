import { afterEach, describe, expect, it, vi } from 'vitest'
import { orderedRoadStops, projectOnRoad, solveRoadRoute } from './road-routing'

afterEach(() => vi.unstubAllGlobals())

const geometry = [
  [
    [9.67, 4.06],
    [9.68, 4.065],
    [9.7, 4.05],
  ],
]
const payload = {
  routes: {
    features: [
      {
        geometry: { paths: geometry },
        attributes: { Total_Kilometers: 6.8, Total_TravelTime: 22 },
      },
    ],
  },
}
const stops: [[number, number], [number, number]] = [
  [9.67, 4.06],
  [9.7, 4.05],
]

describe('road routing', () => {
  it('preserves stop order and return visits, removing adjacent duplicates only', () => {
    expect(orderedRoadStops([stops[0], stops[0], stops[1], stops[0]])).toEqual([
      stops[0],
      stops[1],
      stops[0],
    ])
  })
  it('rejects invalid coordinates before sending a request', async () => {
    const fetcher = vi.fn()
    vi.stubGlobal('fetch', fetcher)
    await expect(solveRoadRoute([[NaN, 4], stops[1]], 'key')).rejects.toThrow(
      'invalides',
    )
    await expect(solveRoadRoute([[181, 4], stops[1]], 'key')).rejects.toThrow(
      'invalides',
    )
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('requires distinct stops and credentials', async () => {
    await expect(solveRoadRoute([stops[0], stops[0]], 'key')).rejects.toThrow(
      'deux étapes',
    )
    await expect(solveRoadRoute(stops, '')).rejects.toThrow('configuré')
  })
  it('requests true road geometry in WGS84, keeps stop order and passes cancellation', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => payload })
    vi.stubGlobal('fetch', fetcher)
    const controller = new AbortController()
    await expect(
      solveRoadRoute(stops, 'test-key', controller.signal),
    ).resolves.toEqual({
      paths: geometry,
      distanceKm: 6.8,
      durationMin: 22,
    })
    const [url, options] = fetcher.mock.calls[0]!
    expect(url).not.toContain('test-key')
    expect(options.signal).toBe(controller.signal)
    expect(options.body.get('outputLines')).toBe('esriNAOutputLineTrueShape')
    expect(options.body.get('outSR')).toBe('4326')
    expect(options.body.get('findBestSequence')).toBe('false')
    expect(options.body.get('ignoreInvalidLocations')).toBe('false')
    expect(JSON.parse(options.body.get('stops')).features[0].geometry.x).toBe(
      9.67,
    )
  })
  it('handles ArcGIS errors even when HTTP succeeds without leaking credentials', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          error: { code: 403, message: 'test-key secret' },
        }),
      }),
    )
    await expect(solveRoadRoute(stops, 'test-key')).rejects.toThrow(
      'accès ArcGIS',
    )
    await expect(solveRoadRoute(stops, 'test-key')).rejects.not.toThrow(
      'secret',
    )
  })
  it('does not fabricate routes on HTTP failure or an empty response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    await expect(solveRoadRoute(stops, 'key')).rejects.toThrow('indisponible')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    )
    await expect(solveRoadRoute(stops, 'key')).rejects.toThrow(
      'Aucun itinéraire',
    )
  })
  it('rejects malformed geometries and missing route metrics', async () => {
    for (const feature of [
      {
        geometry: {
          paths: [
            [
              [1, 2],
              [999, 3],
            ],
          ],
        },
      },
      { geometry: { paths: geometry }, attributes: {} },
    ]) {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            routes: { features: [feature] },
          }),
        }),
      )
      await expect(solveRoadRoute(stops, 'key')).rejects.toThrow()
    }
  })
})

describe('simulated position projection', () => {
  it('projects onto a segment rather than a distant vertex', () => {
    expect(
      projectOnRoad(
        [1, 1],
        [
          [
            [0, 0],
            [2, 0],
          ],
        ],
      ),
    ).toEqual([1, 0])
  })
  it('clamps at endpoints and handles zero length segments', () => {
    expect(
      projectOnRoad(
        [3, 0],
        [
          [
            [0, 0],
            [0, 0],
            [2, 0],
          ],
        ],
      ),
    ).toEqual([2, 0])
  })
  it('never creates a segment between separate paths', () => {
    expect(
      projectOnRoad(
        [5, 0],
        [
          [
            [0, 0],
            [1, 0],
          ],
          [
            [9, 0],
            [10, 0],
          ],
        ],
      ),
    ).toEqual([1, 0])
  })
})
