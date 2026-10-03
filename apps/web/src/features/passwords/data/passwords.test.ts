import { describe, expect, it } from 'vitest'
import { getPasswordSummary, getPasswordUsers } from './passwords'

describe('passwords view-model', () => {
  it('lists users with password flags', () => {
    const rows = getPasswordUsers()
    expect(rows.length).toBeGreaterThanOrEqual(5)
    for (const row of rows) {
      expect(row.email).toBeTruthy()
      expect(row.fullName).toBeTruthy()
      expect(row.role).toBeTruthy()
    }
  })

  it('computes summary consistent with list', () => {
    const summary = getPasswordSummary()
    expect(summary.total).toBe(getPasswordUsers().length)
    expect(summary.mustChange).toBeGreaterThanOrEqual(0)
  })
})