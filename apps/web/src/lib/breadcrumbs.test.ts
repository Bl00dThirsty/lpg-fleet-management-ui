import { describe, expect, it } from 'vitest'
import { createI18nForTest } from '@/lib/i18n'
import { generateBreadcrumbs, labelFor } from './breadcrumbs'

describe('breadcrumbs i18n', () => {
  it('returns French label via labelFor with translator', async () => {
    const i18n = createI18nForTest('fr')
    await i18n.changeLanguage('fr')
    expect(labelFor('trucks', i18n.t as unknown as (k: string) => string)).toBe('Camions')
    expect(labelFor('dashboard', i18n.t as unknown as (k: string) => string)).toBe('Tableau de bord')
  })
  it('returns English label via labelFor with translator', async () => {
    const i18n = createI18nForTest('en')
    await i18n.changeLanguage('en')
    expect(labelFor('trucks', i18n.t as unknown as (k: string) => string)).toBe('Trucks')
    expect(labelFor('dashboard', i18n.t as unknown as (k: string) => string)).toBe('Dashboard')
  })
  it('falls back to French LABEL_MAP when no translator provided', () => {
    expect(labelFor('trucks')).toBe('Camions')
  })
  it('generates French breadcrumbs via generateBreadcrumbs with translator', async () => {
    const i18n = createI18nForTest('fr')
    await i18n.changeLanguage('fr')
    const crumbs = generateBreadcrumbs('/trucks', i18n.t as unknown as (k: string) => string)
    expect(crumbs[0]!.label).toBe('Camions')
  })
  it('generates English breadcrumbs via generateBreadcrumbs with translator', async () => {
    const i18n = createI18nForTest('en')
    await i18n.changeLanguage('en')
    const crumbs = generateBreadcrumbs('/trucks', i18n.t as unknown as (k: string) => string)
    expect(crumbs[0]!.label).toBe('Trucks')
  })
  it('falls back for unknown segment via title case', () => {
    expect(labelFor('unknown-segment')).toBe('Unknown Segment')
  })
})
