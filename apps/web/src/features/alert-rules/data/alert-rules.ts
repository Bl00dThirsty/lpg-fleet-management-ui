import { notification_groups, notification_rules } from '@lpg/mock-data'
import type { NotificationRule, RiskLevel } from '@lpg/types'
import type { AnomalyType } from '@lpg/types'

export type { RiskLevel, AnomalyType }

export interface AlertRuleView {
  id: string
  name: string
  anomalyType: AnomalyType | null
  minSeverity: RiskLevel | null
  targetGroupId: string
  targetGroupName: string
  isActive: boolean
  created_at?: string
  updated_at?: string
}

export const alertSeverityLabels: Record<RiskLevel, string> = {
  FAIBLE: 'Faible',
  MODERE: 'Modéré',
  ELEVE: 'Élevé',
  CRITIQUE: 'Critique',
  CRITIQUEEXTREME: 'Critique extrême',
}

const GROUP_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  notification_groups.map((group) => [group.id, group.name]),
)

export function getAlertRules(): AlertRuleView[] {
  const rules = notification_rules as NotificationRule[]
  return rules.map((rule) => ({
    id: rule.id,
    name: rule.name,
    anomalyType: rule.anomaly_type ?? null,
    minSeverity: rule.min_severity ?? null,
    targetGroupId: rule.target_group_id,
    targetGroupName: GROUP_NAME_BY_ID[rule.target_group_id] ?? rule.target_group_id,
    isActive: rule.is_active,
    updatedAt: rule.updated_at ?? null,
  }))
}

export function getActiveAlertRuleCount(): number {
  return getAlertRules().filter((r) => r.isActive).length
}

export function getAnomalyTypeCount(): number {
  const rules = getAlertRules()
  return new Set(rules.map((r) => r.anomalyType).filter(Boolean)).size
}