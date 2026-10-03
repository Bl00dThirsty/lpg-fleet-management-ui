import { risk_scores, organizations, sites, client_sites, vehicles, users } from '@lpg/mock-data'
import type { RiskEntityType, RiskLevel } from '@lpg/types'

export type { RiskEntityType, RiskLevel }

export interface RiskScoreView {
  id: string
  entity_type: RiskEntityType
  entity_name: string
  score: number
  level: RiskLevel
  level_label: string
  period: string
  model_version: string
  updated_at: string
  detail: string
  details: Record<string, unknown> | null
}

export const riskLevelLabels: Record<RiskLevel, string> = {
  FAIBLE: 'Faible',
  MODERE: 'Modéré',
  ELEVE: 'Élevé',
  CRITIQUE: 'Critique',
  CRITIQUEEXTREME: 'Critique extrême',
}

export const riskLevelOrder: Record<RiskLevel, number> = {
  FAIBLE: 0,
  MODERE: 1,
  ELEVE: 2,
  CRITIQUE: 3,
  CRITIQUEEXTREME: 4,
}

const DETAIL_LABELS: Record<string, string> = {
  anomaly_count_90d: 'Anomalies (90 j)',
  volume_gap_pct_avg: 'Écart de volume moyen',
  unverified_sites: 'Sites non vérifiés',
  offline_devices: 'Appareils hors ligne',
  unacknowledged_tournees: 'Tournées non acquittées',
  pending_redressements: 'Redressements en attente',
  battery_critical: 'Batterie critique',
  overdue_maintenance: 'Maintenance en retard',
  late_deliveries_30d: 'Livraisons en retard (30 j)',
  missed_checkpoints: 'Checkpoints manqués',
}

export function riskDetailLabel(key: string): string {
  return DETAIL_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export const riskEntityLabels: Record<RiskEntityType, string> = {
  MARKETEUR: 'Marketeur',
  TRANSPORTEUR: 'Transporteur',
  LIVREUR: 'Livreur',
  SITE: 'Site',
  TOURNEE: 'Tournée',
  CLIENT: 'Client',
  CLIENTSITE: 'Site client',
  VEHICLE: 'Véhicule',
}

export const riskLevelOptions: readonly { label: string; value: RiskLevel }[] = (
  Object.keys(riskLevelLabels) as RiskLevel[]
).map((value) => ({ label: riskLevelLabels[value], value }))

function entityName(entityType: RiskEntityType, entityId: string): string {
  switch (entityType) {
    case 'SITE':
    case 'CLIENTSITE':
      return [...sites, ...client_sites].find((s) => s.id === entityId)?.name ?? entityId
    case 'VEHICLE':
      return vehicles.find((v) => v.id === entityId)?.license_plate ?? entityId
    case 'LIVREUR': {
      const user = users.find((u) => u.id === entityId)
      return user ? `${user.first_name} ${user.last_name}`.trim() : entityId
    }
    default:
      return organizations.find((o) => o.id === entityId)?.name ?? entityId
  }
}

function detailText(details: Record<string, unknown> | null): string {
  if (!details) return ''
  const parts = Object.entries(details)
    .filter(([, v]) => typeof v === 'number' || typeof v === 'string')
    .map(([k, v]) => `${k}: ${v}`)
  return parts.join(', ')
}

export function getRiskScores(): RiskScoreView[] {
  return risk_scores
    .map((r) => ({
      id: r.id,
      entity_type: r.entity_type,
      entity_name: entityName(r.entity_type, r.entity_id),
      score: r.score,
      level: r.level,
      level_label: riskLevelLabels[r.level],
      period: `${r.period_start.slice(0, 10)} au ${r.period_end.slice(0, 10)}`,
      model_version: r.model_version,
      updated_at: r.updated_at ?? r.created_at ?? '',
      detail: detailText(r.details_json ?? null),
      details: r.details_json ?? null,
    }))
    .sort((a, b) => b.score - a.score)
}

export function getRiskSummary(rows: RiskScoreView[]) {
  return {
    total: rows.length,
    faible: rows.filter((r) => r.level === 'FAIBLE').length,
    modere: rows.filter((r) => r.level === 'MODERE').length,
    eleve: rows.filter((r) => r.level === 'ELEVE').length,
    critique: rows.filter((r) => r.level === 'CRITIQUE' || r.level === 'CRITIQUEEXTREME').length,
    average: rows.length ? Math.round(rows.reduce((acc, r) => acc + r.score, 0) / rows.length) : 0,
  }
}

export interface RiskTypeCount {
  entity_type: RiskEntityType
  entity_label: string
  count: number
  average: number
}

/** Count + average score per entity type (for the composition chart). */
export function getRiskByEntityType(rows: RiskScoreView[]): RiskTypeCount[] {
  const byType = new Map<RiskEntityType, { count: number; total: number }>()
  for (const r of rows) {
    const entry = byType.get(r.entity_type) ?? { count: 0, total: 0 }
    entry.count += 1
    entry.total += r.score
    byType.set(r.entity_type, entry)
  }
  return [...byType.entries()]
    .map(([entity_type, entry]) => ({
      entity_type,
      entity_label: riskEntityLabels[entity_type] ?? entity_type,
      count: entry.count,
      average: entry.count > 0 ? Math.round(entry.total / entry.count) : 0,
    }))
    .sort((a, b) => b.count - a.count)
}