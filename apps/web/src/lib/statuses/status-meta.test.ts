import { describe, it, expect } from 'vitest'
import { resolveStatusMeta } from './status-meta'

describe('resolveStatusMeta', () => {
  it('resolves TOUR status metadata correctly', () => {
    const meta = resolveStatusMeta('TOUR', 'PLANNED')
    expect(meta.code).toBe('PLN')
    expect(meta.label).toBe('Planifiée')
    expect(meta.tone).toBe('sky')
    expect(meta.description).toContain('prête pour le chargement')
  })

  it('resolves PICKUP status metadata correctly', () => {
    const meta = resolveStatusMeta('PICKUP', 'VALIDATED')
    expect(meta.code).toBe('VAL')
    expect(meta.label).toBe('Planifié / Validé')
    expect(meta.tone).toBe('sky')
  })

  it('resolves CONTRACT status metadata correctly', () => {
    const meta = resolveStatusMeta('CONTRACT', 'ACTIVE')
    expect(meta.code).toBe('ACT')
    expect(meta.label).toBe('Actif')
    expect(meta.tone).toBe('emerald')
  })

  it('provides safe fallback for unknown status', () => {
    const fallback = resolveStatusMeta('TOUR', 'UNKNOWN_XYZ')
    expect(fallback.code).toBe('UNK')
    expect(fallback.label).toBe('UNKNOWN_XYZ')
    expect(fallback.tone).toBe('slate')
  })
})
