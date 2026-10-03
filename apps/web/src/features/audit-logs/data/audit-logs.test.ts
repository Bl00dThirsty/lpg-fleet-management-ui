import { describe, expect, it } from 'vitest'
import { getAuditLogs, getAuditSummary, auditActionLabels } from './audit-logs'

describe('audit-logs view-model', () => {
  it('maps audit entries with actor and action labels', () => {
    const rows = getAuditLogs()
    expect(rows.length).toBeGreaterThanOrEqual(4)
    for (const row of rows) {
      expect(row.actionLabel).toBeTruthy()
      expect(row.actor).toBeTruthy()
      expect(row.createdAt).toBeTruthy()
    }
  })

  it('sorts newest first', () => {
    const rows = getAuditLogs()
    const times = rows.map((r) => r.createdAt)
    expect([...times].sort().reverse()).toEqual(times)
  })

  it('computes summary counts', () => {
    const summary = getAuditSummary()
    expect(summary.total).toBe(getAuditLogs().length)
  })

  it('labels known actions', () => {
    expect(auditActionLabels.LOGINSUCCESS).toBe('Connexion réussie')
    expect(auditActionLabels.SETTINGCHANGED).toBe('Paramètre modifié')
  })
})