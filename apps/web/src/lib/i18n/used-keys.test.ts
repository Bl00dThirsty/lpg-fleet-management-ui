import { describe, expect, it } from 'vitest'
import {
  collectStaticKeys,
  collectTemplates,
  expandTemplates,
  findMissingKeys,
  flattenLocaleKeys,
} from './used-keys'

function locale() {
  return {
    details: {
      transported: { title: 'T', description: 'D', badge: 'B' },
      delivered: { title: 'T', description: 'D', badge: 'B' },
      alerts: { title: 'T', description: 'D', badge: 'B' },
    },
    status: { planned: 'P', 'in-progress': 'I', completed: 'C', incident: 'X' },
    units: { TM: 'TM', btl: 'btl' },
  }
}

describe('collectStaticKeys', () => {
  it('finds every literal t() key', () => {
    const keys = collectStaticKeys(
      `const a = t('details.alerts.empty'); const b = t("status.planned")`,
    )

    expect(keys.sort()).toEqual(['details.alerts.empty', 'status.planned'])
  })

  it('ignores a t() call with a dynamic key', () => {
    expect(collectStaticKeys('t(`status.${x}`)')).toEqual([])
  })

  it('finds several literal keys in one expression', () => {
    expect(collectStaticKeys("t('actions.viewDetails') + t('nope')")).toEqual([
      'actions.viewDetails',
      'nope',
    ])
  })

  it('does not match an unrelated call that merely ends in t', () => {
    expect(collectStaticKeys("format('details.alerts.empty')")).toEqual([])
  })
})

describe('collectTemplates', () => {
  it('finds a template with a dynamic segment', () => {
    expect(collectTemplates('t(`details.${id}.title`)')).toEqual([
      'details.${}.title',
    ])
  })

  it('finds a namespaced template', () => {
    expect(collectTemplates('t(`tours:status.${status}`)')).toEqual([
      'status.${}',
    ])
  })
})

describe('expandTemplates', () => {
  it('expands a template against the keys that really exist', () => {
    expect(
      expandTemplates(['details.${}.title'], flattenLocaleKeys(locale())).sort(),
    ).toEqual([
      'details.delivered.title',
      'details.transported.title',
    ])
  })

  it('reports no expansion when the template matches nothing', () => {
    expect(expandTemplates(['missing.${}.title'], flattenLocaleKeys(locale()))).toEqual(
      [],
    )
  })
})

describe('findMissingKeys', () => {
  const source = `
    t('details.alerts.empty')
    t('status.planned')
    t(\`details.\${id}.title\`)
    t(\`units.\${unit}\`)
  `

  it('reports a literal key missing from the locale', () => {
    const missing = findMissingKeys(source, locale(), 'dashboard')

    expect(missing).toContain('details.alerts.empty')
  })

  it('reports a template that resolves to nothing', () => {
    const missing = findMissingKeys("t(`nope.${x}.title`)", locale(), 'dashboard')

    expect(missing).toContain('nope.${}.title')
  })

  it('resolves a namespaced key against its own namespace', () => {
    const missing = findMissingKeys("t('tours:status.planned')", locale(), 'dashboard')

    expect(missing).toEqual([])
  })

  it('accepts a source whose every key exists', () => {
    expect(
      findMissingKeys("t('status.planned')\nt(`units.${unit}`)", locale(), 'dashboard'),
    ).toEqual([])
  })
})
