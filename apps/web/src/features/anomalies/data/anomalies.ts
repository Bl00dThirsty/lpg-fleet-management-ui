import { anomalies, anomaly_assignments, organizations, sites, client_sites, vehicles, users } from '@lpg/mock-data'
import type {
  AnomalyCategory,
  AnomalyStatus,
  AnomalyType,
  RiskEntityType,
  RiskLevel,
} from '@lpg/types'

export type { AnomalyCategory, AnomalyStatus, AnomalyType, RiskEntityType, RiskLevel }

export type AnomalyTrack = 'ALL' | 'INVESTIGATION' | 'TECHNICAL'

export interface AnomalyView {
  id: string
  reference: string
  type: AnomalyType
  type_label: string
  category: AnomalyCategory
  category_label: string
  severity: RiskLevel
  severity_label: string
  status: AnomalyStatus
  status_label: string
  entity_type: RiskEntityType | null
  entity_name: string
  assigned_agent: string | null
  created_at: string
  resolved_at: string | null
}

export const anomalyTypeLabels: Record<AnomalyType, string> = {
  VOLUMEGAP: 'Écart de volume',
  DEVIATIONROUTE: 'Déviation d\'itinéraire',
  CHECKPOINTMISSED: 'Point de contrôle manqué',
  SCANOUTOFSEQUENCE: 'Scan hors séquence',
  SIPHONNAGE: 'Siphonnage suspecté',
  SUBSTITUTIONBOUTEILLES: 'Substitution bouteilles',
  FALSIFICATIONPREUVES: 'Falsification de preuves',
  FILLINGILLEGAL: 'Remplissage illégal',
  DIVERSIONSUBSIDIES: 'Détournement subventions',
  PDAUNSYNCED: 'PDA non synchronisé',
  BATTERYCRITICAL: 'Batterie critique',
  GPSFAILURE: 'Panne GPS',
  KAFKATIMEOUT: 'Timeout Kafka',
  IOTDEGRADATION: 'Dégradation IoT',
  SERVERUNAVAILABLE: 'Serveur indisponible',
  TOURNEEUNASSIGNEDTOOLONG: 'Tournée non assignée',
  TRANSPORTERNOACK: 'Accusé transporteur absent',
  GPSREMOVED: 'GPS retiré',
  DEVICEOFFLINE: 'Appareil hors ligne',
}

export const anomalyCategoryLabels: Record<AnomalyCategory, string> = {
  INVESTIGATION: 'Investigation',
  TECHNICAL: 'Technique',
}

export const anomalyStatusLabels: Record<AnomalyStatus, string> = {
  NOUVEAU: 'Nouveau',
  ENCOURS: 'En cours',
  RESOLU: 'Résolu',
  FERME: 'Fermé',
}

export const severityLabels: Record<RiskLevel, string> = {
  FAIBLE: 'Faible',
  MODERE: 'Modéré',
  ELEVE: 'Élevé',
  CRITIQUE: 'Critique',
  CRITIQUEEXTREME: 'Critique extrême',
}

export const entityTypeLabels: Record<RiskEntityType, string> = {
  MARKETEUR: 'Marketeur',
  TRANSPORTEUR: 'Transporteur',
  LIVREUR: 'Livreur',
  SITE: 'Site',
  TOURNEE: 'Tournée',
  CLIENT: 'Client',
  CLIENTSITE: 'Site client',
  VEHICLE: 'Véhicule',
}

export const anomalyStatusOptions: readonly { label: string; value: AnomalyStatus }[] = (
  Object.keys(anomalyStatusLabels) as AnomalyStatus[]
).map((value) => ({ label: anomalyStatusLabels[value], value }))

function entityName(entityType: RiskEntityType | null, entityId: string | null): string {
  if (!entityId) return '—'
  switch (entityType) {
    case 'SITE':
      return [...sites, ...client_sites].find((s) => s.id === entityId)?.name ?? entityId
    case 'VEHICLE':
      return vehicles.find((v) => v.id === entityId)?.license_plate ?? entityId
    default:
      return organizations.find((o) => o.id === entityId)?.name ?? entityId
  }
}

export function getAnomalies(track: AnomalyTrack = 'ALL'): AnomalyView[] {
  const assignmentByAnomaly = new Map(
    anomaly_assignments
      .slice()
      .sort((a, b) => (b.assigned_at ?? '').localeCompare(a.assigned_at ?? ''))
      .map((a) => [a.anomaly_id, a]),
  )

  const rows = anomalies
    .filter((a) => track === 'ALL' || a.category === track)
    .map((a, i) => {
      const agent = assignmentByAnomaly.get(a.id)
      const agentUser = agent ? users.find((u) => u.id === agent.assigned_to_user_id) : undefined
      return {
        id: a.id,
        reference: `ANM-${String(i + 1).padStart(3, '0')}`,
        type: a.type,
        type_label: anomalyTypeLabels[a.type] ?? a.type,
        category: a.category,
        category_label: anomalyCategoryLabels[a.category],
        severity: a.severity,
        severity_label: severityLabels[a.severity],
        status: a.status,
        status_label: anomalyStatusLabels[a.status],
        entity_type: a.entity_type ?? null,
        entity_name: entityName(a.entity_type ?? null, a.entity_id ?? null),
        assigned_agent: agentUser ? `${agentUser.first_name} ${agentUser.last_name}`.trim() : null,
        created_at: a.created_at ?? '',
        resolved_at: a.resolved_at ?? null,
      }
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  return rows
}

export function getAnomalySummary(rows: AnomalyView[]) {
  return {
    total: rows.length,
    nouveau: rows.filter((r) => r.status === 'NOUVEAU').length,
    encours: rows.filter((r) => r.status === 'ENCOURS').length,
    resolu: rows.filter((r) => r.status === 'RESOLU').length,
    ferme: rows.filter((r) => r.status === 'FERME').length,
    critiques: rows.filter((r) => r.severity === 'CRITIQUE' || r.severity === 'CRITIQUEEXTREME').length,
  }
}