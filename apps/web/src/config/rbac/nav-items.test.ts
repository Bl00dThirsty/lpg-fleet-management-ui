import { describe, expect, it } from 'vitest'
import { createI18nForTest } from '@/lib/i18n'
import { buildSidebarFor } from './nav-items'

describe('nav i18n', () => {
  it('builds French sidebar', async () => {
    const i18n = createI18nForTest('fr')
    await i18n.changeLanguage('fr')
    const sb = buildSidebarFor('SUPERADMIN', i18n.t as unknown as (k: string) => string)
    expect(sb.navGroups[0]!.items[0]!.title).toBe("Vue d'ensemble")
  })
  it('builds English sidebar', async () => {
    const i18n = createI18nForTest('en')
    await i18n.changeLanguage('en')
    const sb = buildSidebarFor('SUPERADMIN', i18n.t as unknown as (k: string) => string)
    expect(sb.navGroups[0]!.items[0]!.title).toBe('Overview')
  })
  it('falls back to French label when no translator provided', () => {
    const sb = buildSidebarFor('SUPERADMIN')
    expect(sb.navGroups[0]!.items[0]!.title).toBe("Vue d'ensemble")
  })
})
