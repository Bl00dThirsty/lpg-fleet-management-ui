import { describe, expect, it } from 'vitest'
import { getActiveAlertRuleCount, getAlertRules, getAnomalyTypeCount } from './alert-rules'

describe('alert-rules view-model', () => {
  it('maps notification rules to alert views', () => {
    const rules = getAlertRules()
    expect(rules.length).toBeGreaterThanOrEqual(5)
    for (const rule of rules) {
      expect(rule.name).toBeTruthy()
      expect(rule.targetGroupName).toBeTruthy()
    }
  })

  it('tracks active rules', () => {
    expect(getActiveAlertRuleCount()).toBe(getAlertRules().filter((r) => r.isActive).length)
  })

  it('counts distinct anomaly types', () => {
    const count = getAnomalyTypeCount()
    expect(count).toBeGreaterThanOrEqual(3)
  })
})