import { describe, expect, it } from 'vitest'
import { resources } from './config'
import { createI18nForTest } from './index'

function flattenKeys(obj: unknown, prefix = ''): string[] {
  const out: string[] = []
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    if (prefix) out.push(prefix)
    return out
  }
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...flattenKeys(v, key))
    } else {
      out.push(key)
    }
  }
  return out
}

describe('i18n acceptance - migrated namespaces parity', () => {
  const migrated = [
    'common',
    'nav',
    'fields',
    'errors',
    'breadcrumbs',
    'overview',
    'dashboard',
    'tours',
    'pickups',
  ] as const

  // Allowlist for keys intentionally only in fr (fallback test fixture)
  const allowlist = new Set<string>(['common:onlyInFr', 'common.onlyInFr'])

  it('fr and en have identical keys for all migrated namespaces', () => {
    for (const ns of migrated) {
      const fr = (resources.fr as Record<string, unknown>)[ns]
      const en = (resources.en as Record<string, unknown>)[ns]
      expect(fr, `missing fr namespace ${ns}`).toBeDefined()
      expect(en, `missing en namespace ${ns}`).toBeDefined()
      const frKeys = new Set(flattenKeys(fr))
      const enKeys = new Set(flattenKeys(en))
      for (const k of frKeys) {
        const full = `${ns}:${k}`
        if (allowlist.has(full) || allowlist.has(k)) continue
        expect(enKeys.has(k), `Missing en/${ns}: ${k}`).toBe(true)
      }
      for (const k of enKeys) {
        expect(frKeys.has(k), `Extra en/${ns}: ${k} not in fr`).toBe(true)
      }
    }
  })

  it('covers 9 migrated namespaces', () => {
    expect(migrated.length).toBe(9)
  })

  it('pickups exemplar translates title via i18n', async () => {
    const i18nFr = createI18nForTest('fr')
    expect(i18nFr.t('pickups:title')).toBe('Approvisionnements (Flux 1)')
    const i18nEn = createI18nForTest('en')
    await i18nEn.changeLanguage('en')
    expect(i18nEn.t('pickups:title')).toBe('Supply pickups (Flow 1)')
  })

  it('errors server keys are present in both locales', async () => {
    const i18nFr = createI18nForTest('fr')
    expect(i18nFr.t('errors:server.generic')).toBe('Une erreur serveur est survenue')
    const i18nEn = createI18nForTest('en')
    await i18nEn.changeLanguage('en')
    expect(i18nEn.t('errors:server.generic')).toBe('A server error occurred')
  })

  it('exposes flattenKeys helper parity with check script', () => {
    expect(flattenKeys({ a: { b: '1', c: '2' }, d: '3' }).sort()).toEqual(['a.b', 'a.c', 'd'])
    expect(flattenKeys({})).toEqual([])
  })
})
