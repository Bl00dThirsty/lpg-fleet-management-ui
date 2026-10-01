import { describe, expect, it } from 'vitest'
import { explainPromotion, type PromotionThresholds } from './auto-promotion'

const TH: PromotionThresholds = { auto: 80, flag: 30 }

const t = (fr: string) => fr

describe('explainPromotion', () => {
  it('returns null for non-ACTIVE rows', () => {
    expect(explainPromotion(
      { id: 's', status: 'ASSIGNED', delivery_count: 7, geo_confidence_score: 90 },
      TH,
      t,
    )).toBeNull()
  })

  it('explains delivery count trigger', () => {
    expect(explainPromotion(
      { id: 's', status: 'ACTIVE', delivery_count: 7, geo_confidence_score: 0 },
      TH,
      t,
    )).toBe('≥5 livraisons (7)')
  })

  it('explains geo confidence trigger', () => {
    expect(explainPromotion(
      { id: 's', status: 'ACTIVE', delivery_count: 2, geo_confidence_score: 84 },
      TH,
      t,
    )).toBe('Confiance geo 84/80')
  })

  it('combines both triggers when both satisfied', () => {
    expect(explainPromotion(
      { id: 's', status: 'ACTIVE', delivery_count: 7, geo_confidence_score: 84 },
      TH,
      t,
    )).toBe('≥5 livraisons (7) + Confiance geo 84/80')
  })

  it('returns null when neither trigger satisfied', () => {
    expect(explainPromotion(
      { id: 's', status: 'ACTIVE', delivery_count: 1, geo_confidence_score: 20 },
      TH,
      t,
    )).toBeNull()
  })
})
