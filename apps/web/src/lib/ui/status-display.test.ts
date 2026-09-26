import { describe, expect, it } from 'vitest'
import { makeStatusDisplay } from './status-display'

describe('makeStatusDisplay', () => {
  type Status = 'DRAFT' | 'ACTIVE' | 'CLOSED'
  const labels: Record<Status, string> = {
    DRAFT: 'Brouillon',
    ACTIVE: 'Actif',
    CLOSED: 'Clôturé',
  }
  const classes: Record<Status, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    CLOSED: 'bg-zinc-100 text-zinc-700',
  }

  it('returns the label for a known status', () => {
    const display = makeStatusDisplay({ labels, classes })
    expect(display.label('ACTIVE')).toBe('Actif')
  })

  it('returns the class string for a known status', () => {
    const display = makeStatusDisplay({ labels, classes })
    expect(display.classes('DRAFT')).toBe('bg-slate-100 text-slate-700')
  })

  it('exposes the full set of status keys', () => {
    const display = makeStatusDisplay({ labels, classes })
    expect(display.keys).toEqual(['DRAFT', 'ACTIVE', 'CLOSED'])
  })

  it('isKnown narrows the type for unknown string inputs', () => {
    const display = makeStatusDisplay({ labels, classes })
    const value: string = 'BOGUS'
    expect(display.isKnown(value)).toBe(false)
    const narrowed: Status | undefined = display.isKnown(value) ? value : undefined
    expect(narrowed).toBeUndefined()
  })

  it('isKnown returns true for known keys', () => {
    const display = makeStatusDisplay({ labels, classes })
    expect(display.isKnown('ACTIVE')).toBe(true)
  })

  it('keeps labels and classes aligned on the same key set', () => {
    // The two maps share the same K — passing mismatched keys is a type
    // error, not a runtime surprise. This test is here to document that
    // guarantee explicitly so a future refactor does not silently loosen it.
    const display = makeStatusDisplay({ labels, classes })
    for (const key of display.keys) {
      expect(display.label(key)).toBeTruthy()
      expect(display.classes(key)).toBeTruthy()
    }
  })
})
