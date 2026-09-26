import { describe, expect, it } from 'vitest'
import { getRouteTripsView } from '@/features/tours/data/tour-activity'
import { parseLocalDate } from './local-date-range'
import { buildDashboardView } from '../data/dashboard'
import {
  buildDashboardCsvText,
  createBrowserCsvDownloadEnvironment,
  exportDashboardCsv,
  type CsvDownloadEnvironment,
} from './export-csv'

function fullRange() {
  const dates = getRouteTripsView('ALL').flatMap((trip) => [
    parseLocalDate(trip.startedAt),
    parseLocalDate(trip.lastUpdatedAt),
  ])
  return {
    from: new Date(Math.min(...dates.map((date) => date.getTime()))),
    to: new Date(Math.max(...dates.map((date) => date.getTime()))),
  }
}

const dashboard = buildDashboardView(
  undefined,
  undefined,
  { period: 'monthly', range: fullRange() },
  (key) => key,
)

function recorder() {
  const calls: string[] = []
  let anchor: { download: string; href: string } | null = null
  const env: CsvDownloadEnvironment = {
    createObjectUrl: () => {
      calls.push('createObjectUrl')
      return 'blob:dashboard'
    },
    revokeObjectUrl: (url) => calls.push(`revoke:${url}`),
    attachAnchor: (next) => {
      calls.push('attachAnchor')
      anchor = next
    },
    clickAnchor: () => calls.push('clickAnchor'),
    scheduleRevoke: (task) => {
      calls.push('scheduleRevoke')
      task()
    },
  }
  return { env, calls, getAnchor: () => anchor }
}

describe('buildDashboardCsvText', () => {
  it('prefixes a UTF-8 byte order mark for spreadsheet compatibility', () => {
    expect(buildDashboardCsvText([['a', 'b']]).startsWith('\uFEFF')).toBe(true)
  })

  it('joins cells with a semicolon and rows with a CRLF', () => {
    const text = buildDashboardCsvText([
      ['a', 'b'],
      ['c', 'd'],
    ])

    expect(text).toBe('\uFEFFa;b\r\nc;d')
  })

  it('quotes a cell that contains a separator, a quote or a newline', () => {
    const text = buildDashboardCsvText([['a;b', 'c"d', 'e\nf', 'plain']])

    expect(text).toContain('"a;b"')
    expect(text).toContain('"c""d"')
    expect(text).toContain('"e\nf"')
    expect(text).toContain('plain')
  })
})

describe('exportDashboardCsv', () => {
  it('attaches the anchor before clicking and revokes only afterwards', () => {
    const { env, calls } = recorder()
    exportDashboardCsv(dashboard, (key) => key, env)

    expect(calls).toEqual([
      'createObjectUrl',
      'attachAnchor',
      'clickAnchor',
      'scheduleRevoke',
      'revoke:blob:dashboard',
    ])
  })

  it('names the download from the dashboard generation day', () => {
    const { env, getAnchor } = recorder()
    exportDashboardCsv(dashboard, (key) => key, env)

    expect(getAnchor()?.download).toBe(
      `dashboard-${dashboard.overview.generatedAt.slice(0, 10)}.csv`,
    )
  })

  it('points the anchor at the object url it created', () => {
    const { env, getAnchor } = recorder()
    exportDashboardCsv(dashboard, (key) => key, env)

    expect(getAnchor()?.href).toBe('blob:dashboard')
  })
})

describe('createBrowserCsvDownloadEnvironment', () => {
  function withFakeDom(run: (env: CsvDownloadEnvironment) => void) {
    const appended: unknown[] = []
    const clicked: string[] = []
    const revoked: string[] = []
    const timers: Array<() => void> = []
    const created: string[] = []
    const previousDocument = globalThis.document
    const previousUrl = globalThis.URL

    const anchorElement = {
      href: '',
      download: '',
      rel: '',
      style: { display: '' },
      click: () => clicked.push('click'),
    }

    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: {
        createElement: () => ({ ...anchorElement }),
        body: { appendChild: (node: unknown) => appended.push(node) },
      },
    })
    Object.defineProperty(globalThis, 'URL', {
      configurable: true,
      value: {
        createObjectURL: () => {
          created.push('createObjectURL')
          return 'blob:generated'
        },
        revokeObjectURL: (url: string) => revoked.push(url),
      },
    })
    const previousSetTimeout = globalThis.setTimeout
    globalThis.setTimeout = ((task: () => void) => {
      timers.push(task)
      return 0
    }) as typeof setTimeout

    try {
      const env = createBrowserCsvDownloadEnvironment()
      const url = env.createObjectUrl('a;b')
      env.attachAnchor({ href: url, download: 'dashboard.csv' })
      env.clickAnchor({ href: url, download: 'dashboard.csv' })
      expect(revoked).toEqual([])
      timers.forEach((task) => task())
      run(env)
      expect(created).toEqual(['createObjectURL'])
      expect(appended).toHaveLength(1)
      expect(clicked).toEqual(['click'])
      expect(revoked).toEqual([])
    } finally {
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: previousDocument,
      })
      Object.defineProperty(globalThis, 'URL', {
        configurable: true,
        value: previousUrl,
      })
      globalThis.setTimeout = previousSetTimeout
    }
  }

  it('appends the anchor to the document before the click and revokes later', () => {
    withFakeDom(() => undefined)
  })

  it('fails loudly when no document is available', () => {
    expect(() => createBrowserCsvDownloadEnvironment()).toThrow(/document/)
  })
})
