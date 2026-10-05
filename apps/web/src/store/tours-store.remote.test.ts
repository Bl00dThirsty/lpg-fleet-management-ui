import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Exercise the real adapter branch without sending requests to the hosted project.
vi.mock('@lpg/api-client', () => ({
  api: { tours: { list: vi.fn(), create: vi.fn(), assignDriver: vi.fn() } },
  apiAdapter: { setAccessTokenGetter: vi.fn(), setOnUnauthorized: vi.fn() },
}))

async function stores() {
  const { useAuthStore } = await import('./auth-store')
  const { useToursStore } = await import('./tours-store')
  const { api } = await import('@lpg/api-client')
  return { useAuthStore, useToursStore, api }
}

describe('remote tour persistence', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_API_MODE', 'http')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('starts without mock tours and accepts an empty server list', async () => {
    const { useToursStore, api } = await stores()
    expect(useToursStore.getState().tours).toEqual([])
    vi.mocked(api.tours.list).mockResolvedValue({
      data: [],
      pagination: { page: 0, limit: 100, total: 0, pages: 0 },
    })
    await useToursStore.getState().fetchTours()
    expect(useToursStore.getState().tours).toEqual([])
    expect(useToursStore.getState().hasLoaded).toBe(true)
  })

  it('does not turn a rejected assignment into a local success', async () => {
    const { useToursStore, api } = await stores()
    vi.mocked(api.tours.assignDriver).mockRejectedValue(new Error('Forbidden'))
    await expect(
      useToursStore.getState().assignDriver('test', 'foreign-driver')
    ).rejects.toThrow('Forbidden')
    expect(useToursStore.getState().tours).toEqual([])
  })

  it('reports loading failures and allows retry', async () => {
    const { useToursStore, api } = await stores()
    useToursStore.setState({ hasLoaded: false, lastFetchedAt: 0, error: null })
    vi.mocked(api.tours.list).mockRejectedValue(new Error('Offline'))
    await useToursStore.getState().fetchTours()
    expect(useToursStore.getState().hasLoaded).toBe(false)
    expect(useToursStore.getState().error).toBeTruthy()
  })
})
