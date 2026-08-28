import { describe, expect, it } from 'vitest'
import {
  getNotifActiveRuleCount,
  getNotifRuleCount,
  getNotifRoutingGroups,
} from './notification-rules'
import { severityLabels } from '@/features/anomalies/data/anomalies'

describe('notification-rules routing view-model', () => {
  it('routes every rule to a target group', () => {
    const groups = getNotifRoutingGroups()
    const total = groups.reduce((acc, g) => acc + g.ruleCount, 0)
    expect(total).toBe(getNotifRuleCount())
  })

  it('tracks active rule counts across groups', () => {
    expect(getNotifActiveRuleCount()).toBeGreaterThanOrEqual(1)
  })

  it('excludes soft-deleted rules from routing groups', () => {
    const base = getNotifRoutingGroups()
    const deletedCount = base.reduce((acc, g) => acc + g.ruleCount, 0) + 1
    const withDeleted = getNotifRoutingGroups([
      {
        id: 'rule-deleted',
        name: 'Supprimée',
        target_group_id: base[0]?.targetGroupId ?? 'group-1',
        anomaly_type: null,
        min_severity: null,
        is_active: false,
        deleted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    const withDeletedCount = withDeleted.reduce((acc, g) => acc + g.ruleCount, 0)
    expect(withDeletedCount).toBeLessThan(deletedCount)
    expect(withDeleted.some((g) => g.rules.some((r) => r.id === 'rule-deleted'))).toBe(false)
  })

  it('labels severity thresholds', () => {
    expect(severityLabels.CRITIQUE).toBe('Critique')
    expect(severityLabels.MODERE).toBe('Modéré')
  })
})
