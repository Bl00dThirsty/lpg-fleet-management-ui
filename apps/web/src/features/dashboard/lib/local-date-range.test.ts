import { describe, expect, it } from 'vitest'
import { getLocalDateRange, parseLocalDate } from './local-date-range'

describe('getLocalDateRange', () => {
  it('uses local calendar boundaries for the selected day', () => {
    const now = new Date(2026, 1, 13, 23, 45, 12)
    const range = getLocalDateRange('daily', now)

    expect(range.from).toEqual(new Date(2026, 1, 13, 0, 0, 0, 0))
    expect(range.to).toEqual(new Date(2026, 1, 13, 23, 59, 59, 999))
  })

  it('starts the week on Monday in the local timezone', () => {
    const now = new Date(2026, 1, 18, 12)
    const range = getLocalDateRange('weekly', now)

    expect(range.from).toEqual(new Date(2026, 1, 16, 0, 0, 0, 0))
    expect(range.to).toEqual(new Date(2026, 1, 22, 23, 59, 59, 999))
  })

  it('uses local month boundaries without UTC date shifting', () => {
    const now = new Date(2026, 1, 18, 12)
    const range = getLocalDateRange('monthly', now)

    expect(range.from).toEqual(new Date(2026, 1, 1, 0, 0, 0, 0))
    expect(range.to).toEqual(new Date(2026, 1, 28, 23, 59, 59, 999))
  })

  it('parses date-only values as local calendar dates', () => {
    expect(parseLocalDate('2026-02-01')).toEqual(new Date(2026, 1, 1))
  })
})
