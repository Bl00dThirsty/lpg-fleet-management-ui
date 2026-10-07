import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  getTourLiveRefreshIntervalMs,
  triggerTourLiveRefresh,
} from './use-tour-live-refresh'
import { useToursStore } from '@/store/tours-store'

describe('use-tour-live-refresh helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reads the refresh interval from settings model (5 seconds default)', () => {
    const interval = getTourLiveRefreshIntervalMs()
    expect(interval).toBe(5000)
  })

  it('triggers silent force-refresh for tours and specified checkpoints', () => {
    const fetchToursSpy = vi
      .spyOn(useToursStore.getState(), 'fetchTours')
      .mockResolvedValue()
    const fetchCheckpointsSpy = vi
      .spyOn(useToursStore.getState(), 'fetchCheckpoints')
      .mockResolvedValue([])

    triggerTourLiveRefresh('tour-active-001')

    expect(fetchToursSpy).toHaveBeenCalledWith(true, true)
    expect(fetchCheckpointsSpy).toHaveBeenCalledWith(
      'tour-active-001',
      true,
      true
    )
  })

  it('triggers silent force-refresh for tours without checkpoints when no tourId given', () => {
    const fetchToursSpy = vi
      .spyOn(useToursStore.getState(), 'fetchTours')
      .mockResolvedValue()
    const fetchCheckpointsSpy = vi
      .spyOn(useToursStore.getState(), 'fetchCheckpoints')
      .mockResolvedValue([])

    triggerTourLiveRefresh()

    expect(fetchToursSpy).toHaveBeenCalledWith(true, true)
    expect(fetchCheckpointsSpy).not.toHaveBeenCalled()
  })
})
