import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createReportAndPoll, isTerminal, TERMINAL_STATUSES } from './use-report'

describe('use-report', () => {
  describe('isTerminal', () => {
    it('treats READY/FAILED/EXPIRED as terminal', () => {
      expect(isTerminal('READY')).toBe(true)
      expect(isTerminal('FAILED')).toBe(true)
      expect(isTerminal('EXPIRED')).toBe(true)
      expect(isTerminal('GENERATING')).toBe(false)
      expect(isTerminal('PENDING')).toBe(false)
    })

    it('exposes the terminal set as a const tuple', () => {
      expect(TERMINAL_STATUSES).toEqual(['READY', 'FAILED', 'EXPIRED'])
    })
  })

  describe('createReportAndPoll', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('resolves with the file URL once the report becomes READY', async () => {
      const getStatus = vi
        .fn<(id: string) => Promise<{ status: string; file_url?: string | null }>>()
        .mockResolvedValueOnce({ status: 'GENERATING' })
        .mockResolvedValueOnce({ status: 'READY', file_url: 'https://cdn/report.pdf' })

      const result = createReportAndPoll('rep-1', getStatus, {
        intervalMs: 1500,
        timeoutMs: 60000,
      })
      await vi.advanceTimersByTimeAsync(1500)

      await expect(result).resolves.toEqual({
        status: 'READY',
        fileUrl: 'https://cdn/report.pdf',
      })
      expect(getStatus).toHaveBeenCalledWith('rep-1')
      expect(getStatus).toHaveBeenCalledTimes(2)
    })

    it('resolves FAILED as soon as the backend reports it', async () => {
      const getStatus = vi
        .fn<(id: string) => Promise<{ status: string; file_url?: string | null }>>()
        .mockResolvedValue({ status: 'FAILED' })

      await expect(
        createReportAndPoll('rep-2', getStatus, { intervalMs: 1500, timeoutMs: 60000 }),
      ).resolves.toEqual({ status: 'FAILED', fileUrl: undefined })
    })

    it('resolves EXPIRED when the timeout elapses without a terminal status', async () => {
      const getStatus = vi
        .fn<(id: string) => Promise<{ status: string; file_url?: string | null }>>()
        .mockResolvedValue({ status: 'GENERATING' })

      const result = createReportAndPoll('rep-3', getStatus, {
        intervalMs: 1500,
        timeoutMs: 60000,
      })
      await vi.advanceTimersByTimeAsync(60000)

      await expect(result).resolves.toEqual({ status: 'EXPIRED', fileUrl: undefined })
    })
  })
})
