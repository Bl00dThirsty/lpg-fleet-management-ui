import type { SiteRow, SiteStatus } from './site-status-machine'

export interface PromotionThresholds {
  /** Min geo_confidence_score to auto-promote to ACTIVE. */
  auto: number
  /** Below this, the row is flagged for review. */
  flag: number
}

type Translator = (fr: string) => string

const MIN_DELIVERIES = 5

export function explainPromotion(
  row: Pick<SiteRow, 'id' | 'status' | 'delivery_count' | 'geo_confidence_score'>,
  thresholds: PromotionThresholds,
  t: Translator,
): string | null {
  if (row.status !== ('ACTIVE' as SiteStatus)) return null

  const parts: string[] = []
  if (row.delivery_count >= MIN_DELIVERIES) {
    parts.push(`≥${MIN_DELIVERIES} livraisons (${row.delivery_count})`)
  }
  if (row.geo_confidence_score >= thresholds.auto) {
    parts.push(`Confiance geo ${row.geo_confidence_score}/${thresholds.auto}`)
  }
  if (parts.length === 0) return null
  return t(parts.join(' + '))
}
