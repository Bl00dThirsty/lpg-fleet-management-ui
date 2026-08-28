import { describe, expect, it } from 'vitest'
import { createI18nForTest } from '@/lib/i18n'
import { getSiteStatusOptions, getTourneeStatusOptions, getPickupStatusOptions, getRiskLevelOptions } from './field-options'

describe('field-options i18n', () => {
  it('translates site status in French', async () => {
    const i18n = createI18nForTest('fr')
    await i18n.changeLanguage('fr')
    const opts = getSiteStatusOptions(i18n.t as unknown as (k: string) => string)
    expect(opts.find((o) => o.value === 'UNASSIGNED')?.label).toBe('Non assigné')
    expect(opts.find((o) => o.value === 'ACTIVE')?.label).toBe('Actif')
  })
  it('translates site status in English', async () => {
    const i18n = createI18nForTest('en')
    await i18n.changeLanguage('en')
    const opts = getSiteStatusOptions(i18n.t as unknown as (k: string) => string)
    expect(opts.find((o) => o.value === 'UNASSIGNED')?.label).toBe('Unassigned')
    expect(opts.find((o) => o.value === 'ACTIVE')?.label).toBe('Active')
  })
  it('translates tournee status in French vs English', async () => {
    const i18nFr = createI18nForTest('fr')
    await i18nFr.changeLanguage('fr')
    const frOpts = getTourneeStatusOptions(i18nFr.t as unknown as (k: string) => string)
    expect(frOpts.find((o) => o.value === 'PLANNED')?.label).toBe('Planifiée')

    const i18nEn = createI18nForTest('en')
    await i18nEn.changeLanguage('en')
    const enOpts = getTourneeStatusOptions(i18nEn.t as unknown as (k: string) => string)
    expect(enOpts.find((o) => o.value === 'PLANNED')?.label).toBe('Planned')
  })
  it('translates pickup status in both locales', async () => {
    const i18nFr = createI18nForTest('fr')
    await i18nFr.changeLanguage('fr')
    const frOpts = getPickupStatusOptions(i18nFr.t as unknown as (k: string) => string)
    expect(frOpts.find((o) => o.value === 'VALIDATED')?.label).toBe('Validée')

    const i18nEn = createI18nForTest('en')
    await i18nEn.changeLanguage('en')
    const enOpts = getPickupStatusOptions(i18nEn.t as unknown as (k: string) => string)
    expect(enOpts.find((o) => o.value === 'VALIDATED')?.label).toBe('Validated')
  })
  it('translates risk level in both locales', async () => {
    const i18nFr = createI18nForTest('fr')
    await i18nFr.changeLanguage('fr')
    expect(getRiskLevelOptions(i18nFr.t as unknown as (k: string) => string).find((o) => o.value === 'ELEVE')?.label).toBe('Élevé')

    const i18nEn = createI18nForTest('en')
    await i18nEn.changeLanguage('en')
    expect(getRiskLevelOptions(i18nEn.t as unknown as (k: string) => string).find((o) => o.value === 'ELEVE')?.label).toBe('High')
  })
})
