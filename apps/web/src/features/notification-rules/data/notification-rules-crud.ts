import type { AnomalyType, NotificationRule, RiskLevel } from '@lpg/types'
import { field, type FieldConfig, type FormValues } from '@/components/entity-crud'
import { anomalyTypeLabels } from '@/features/anomalies/data/anomalies'
import { severityLabels } from '@/features/anomalies/data/anomalies'
import { getNotificationGroups } from '@/features/notification-groups/data/notification-groups'

const ANOMALY_OPTIONS: { label: string; value: string }[] = (
  Object.keys(anomalyTypeLabels) as AnomalyType[]
).map((value) => ({ label: anomalyTypeLabels[value], value }))

const SEVERITY_OPTIONS: { label: string; value: string }[] = (
  Object.keys(severityLabels) as RiskLevel[]
).map((value) => ({ label: severityLabels[value], value }))

export const GROUP_OPTIONS = (): { label: string; value: string }[] =>
  getNotificationGroups().map((g) => ({ label: g.name, value: g.id }))

export const notificationRuleFields: FieldConfig[] = [
  field.text('name', 'Nom de la règle', { required: true }),
  field.select('target_group_id', 'Groupe cible', GROUP_OPTIONS(), { required: true }),
  field.select('anomaly_type', "Type d'anomalie", ANOMALY_OPTIONS, {
    placeholder: 'Toutes les anomalies',
  }),
  field.select('min_severity', 'Sévérité minimale', SEVERITY_OPTIONS, {
    placeholder: 'Toutes sévérités',
  }),
  field.switchField('is_active', 'Règle active'),
]

export function notificationRuleToForm(rule: NotificationRule): FormValues {
  return {
    id: rule.id,
    name: rule.name,
    target_group_id: rule.target_group_id,
    anomaly_type: rule.anomaly_type ?? '',
    min_severity: rule.min_severity ?? '',
    is_active: rule.is_active,
  }
}

export function notificationRuleFromForm(v: FormValues): Partial<NotificationRule> {
  const anomalyType = String(v.anomaly_type ?? '')
  const minSeverity = String(v.min_severity ?? '')
  return {
    name: String(v.name).trim(),
    target_group_id: String(v.target_group_id),
    anomaly_type: (anomalyType ? (anomalyType as AnomalyType) : null) as AnomalyType | null,
    min_severity: (minSeverity ? (minSeverity as RiskLevel) : null) as RiskLevel | null,
    is_active: Boolean(v.is_active),
  }
}