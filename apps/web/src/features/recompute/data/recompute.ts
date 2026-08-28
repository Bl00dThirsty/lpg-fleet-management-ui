import { risk_scores } from '@lpg/mock-data'
import type { RiskScore, RiskLevel, RiskEntityType } from '@lpg/types'

export interface RiskScoreView {
  id: string
  entityType: RiskEntityType
  entityId: string
  score: number
  level: RiskLevel
  periodStart: string
  periodEnd: string
  modelVersion: string
}

export const riskLevelLabels: Record<RiskLevel, string> = {
  FAIBLE: 'Faible',
  MODERE: 'Modéré',
  ELEVE: 'Élevé',
  CRITIQUE: 'Critique',
  CRITIQUEEXTREME: 'Critique extrême',
}

export const riskLevelClasses: Record<RiskLevel, string> = {
  FAIBLE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  MODERE: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  ELEVE: 'bg-orange-500/10 text-orange-700 dark:text-orange-300',
  CRITIQUE: 'bg-red-500/10 text-red-700 dark:text-red-300',
  CRITIQUEEXTREME: 'bg-red-600/10 text-red-700 dark:text-red-400',
}

export const entityTypeLabels: Record<RiskEntityType, string> = {
  MARKETEUR: 'Marchand',
  TRANSPORTEUR: 'Transporteur',
  LIVREUR: 'Livreur',
  SITE: 'Site',
  TOURNEE: 'Tournée',
  CLIENT: 'Client',
  CLIENTSITE: 'Site client',
  VEHICLE: 'Véhicule',
}

export function buildRiskScoreView(scores: RiskScore[]): RiskScoreView[] {
  return scores.map((s) => ({
    id: s.id,
    entityType: s.entity_type,
    entityId: s.entity_id,
    score: s.score,
    level: s.level,
    periodStart: s.period_start,
    periodEnd: s.period_end,
    modelVersion: s.model_version,
  }))
}

export function getRecomputeView(): RiskScoreView[] {
  return buildRiskScoreView(risk_scores as RiskScore[])
}

export function getRecomputeById(id: string): RiskScoreView | undefined {
  const score = (risk_scores as RiskScore[]).find((s) => s.id === id)
  return score ? buildRiskScoreView([score])[0] : undefined
}

export const recomputeView: readonly RiskScoreView[] = getRecomputeView()
