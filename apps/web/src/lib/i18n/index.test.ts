import { describe, expect, it } from 'vitest'
import { createI18nForTest } from './index'

describe('i18n init', () => {
  it('translates nav key in French', async () => {
    const i18n = createI18nForTest('fr')
    await i18n.changeLanguage('fr')
    expect(i18n.t('nav:overview', { defaultValue: '__missing__' })).toBe("Vue d'ensemble")
  })
  it('translates nav key in English', async () => {
    const i18n = createI18nForTest('en')
    await i18n.changeLanguage('en')
    expect(i18n.t('nav:overview', { defaultValue: '__missing__' })).toBe('Overview')
  })
  it('falls back to French when English key missing', async () => {
    const i18n = createI18nForTest('en')
    await i18n.changeLanguage('en')
    // seed a key only in fr
    expect(i18n.t('common:onlyInFr', { defaultValue: '__fallback__' })).toBe('Seulement FR')
  })
})
