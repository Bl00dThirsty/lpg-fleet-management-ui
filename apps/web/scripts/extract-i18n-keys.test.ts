import { describe, expect, it } from 'vitest'
import { collectKeys } from './extract-i18n-keys'

describe('extract', () => {
  it('finds label literals', () => {
    const src = "label: 'Créer' // français"
    expect(collectKeys(src)).toContain('Créer')
  })
})
