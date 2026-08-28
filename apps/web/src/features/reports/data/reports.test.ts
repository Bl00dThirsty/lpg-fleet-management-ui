import { describe, expect, it } from 'vitest'
import {
  formatFileSize,
  getReportSummary,
  getReports,
  reportStatusLabels,
  reportTypeLabels,
} from './reports'
import { useReportsStore, stopReportsPolling } from './reports-store'
import type { Report } from '@lpg/types'

describe('reports view-model', () => {
  it('maps reports with labels', () => {
    const rows = getReports()
    expect(rows.length).toBeGreaterThanOrEqual(4)
    for (const row of rows) {
      expect(row.name).toBeTruthy()
      expect(reportTypeLabels[row.type]).toBe(row.typeLabel)
      expect(reportStatusLabels[row.status]).toBe(row.statusLabel)
    }
  })

  it('computes status summary', () => {
    const summary = getReportSummary()
    expect(summary.total).toBe(getReports().length)
    expect(summary.ready).toBeGreaterThanOrEqual(1)
  })

  it('formats file sizes', () => {
    expect(formatFileSize(null)).toBe('')
    expect(formatFileSize(512)).toBe('512 o')
    expect(formatFileSize(2048)).toBe('2.0 Ko')
  })
})

describe('reports-store async generation', () => {
  it('advances PENDING -> GENERATING -> READY through ticks', () => {
    const now = new Date().toISOString()
    const pending: Report = {
      id: 'rep-test',
      name: 'Rapport test',
      type: 'OPERATIONAL',
      format: 'CSV',
      status: 'PENDING',
      parameters_json: {},
      created_at: now,
      updated_at: now,
    }
    useReportsStore.setState({ reports: [pending], hasPending: true })
    useReportsStore.getState().tick()
    expect(useReportsStore.getState().reports[0]?.status).toBe('GENERATING')
    useReportsStore.getState().tick()
    const ready = useReportsStore.getState().reports[0]
    expect(ready?.status).toBe('READY')
    expect(ready?.generated_at).toBeTruthy()
    expect(ready?.file_url).toContain('/reports/rep-test')
    expect(useReportsStore.getState().hasPending).toBe(false)
  })

  it('requests a report and flags hasPending', () => {
    useReportsStore.setState({ reports: [], hasPending: false })
    useReportsStore.getState().requestReport('Rapport vol', 'FINANCIAL', 'PDF')
    const first = useReportsStore.getState().reports[0]
    expect(first?.status).toBe('PENDING')
    expect(first?.type).toBe('FINANCIAL')
    expect(useReportsStore.getState().hasPending).toBe(true)
    stopReportsPolling()
  })
})