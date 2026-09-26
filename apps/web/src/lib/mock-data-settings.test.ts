import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { curated } from '@lpg/mock-data'
import { getSetting, getSettingFunctions, getSettingNumber } from '@lpg/mock-data'
import type { Setting } from '@lpg/types'

/**
 * Settings-driven invariant guard (AGENTS.md §4a).
 *
 * The whole point of `getSetting` / `getSettingNumber` / `getSettingFunctions`
 * is that **no business threshold lives in code** — every tunable (geo
 * confidence, battery alerts, SLA timeouts, reconciliation tolerance,
 * retention years, MFA roles) is read by `setting_key` from the `settings`
 * fixture. This file pins that contract so a future refactor that breaks it
 * (returns the wrong type, swallows `null`, hardcodes a fallback) fails
 * loudly here, not in some obscure feature deep in the tree.
 *
 * The `settings` table is mutated in place via the exported `curated` object
 * so the helpers under test see exactly the same data shape production uses.
 */

const makeSetting = (key: string, value: string): Setting => ({
  id: `test-${key}`,
  setting_key: key,
  setting_value: value,
  value_type: 'string',
  category: 'test',
  description: null,
  is_encrypted: false,
  requires_restart: false,
})

const upsertSetting = (key: string, value: string): void => {
  const idx = curated.settings.findIndex((s) => s.setting_key === key)
  const next = makeSetting(key, value)
  if (idx >= 0) curated.settings[idx] = next
  else curated.settings.push(next)
}

const removeSetting = (key: string): void => {
  const idx = curated.settings.findIndex((s) => s.setting_key === key)
  if (idx >= 0) curated.settings.splice(idx, 1)
}

const keysTouched: string[] = []

const remember = (key: string): void => {
  if (!keysTouched.includes(key)) keysTouched.push(key)
}

beforeEach(() => {
  keysTouched.length = 0
})

afterEach(() => {
  for (const k of keysTouched) removeSetting(k)
})

describe('getSetting', () => {
  it('returns the stringified value when the setting exists', () => {
    remember('geo.confidence_min')
    upsertSetting('geo.confidence_min', '0.85')
    expect(getSetting('geo.confidence_min')).toBe('0.85')
  })

  it('returns null when the setting is absent', () => {
    expect(getSetting('nope.missing')).toBeNull()
  })

  it('returns the empty string verbatim when the value is "" (callers must opt in to null)', () => {
    // The Setting type forces setting_value: string, so the helpers return "" as-is.
    // Callers that want null for "unset" must check via `getSetting(key) === ''` or
    // `getSettingNumber(key) === null` (the number helper DOES treat "" as null).
    remember('a.blank')
    upsertSetting('a.blank', '')
    expect(getSetting('a.blank')).toBe('')
  })

  it('returns string values verbatim (no JSON-decoding, no coercion)', () => {
    remember('a.number')
    remember('a.bool')
    remember('a.json')
    upsertSetting('a.number', '42')
    upsertSetting('a.bool', 'true')
    upsertSetting('a.json', '{"role":"ADMIN"}')
    expect(getSetting('a.number')).toBe('42')
    expect(getSetting('a.bool')).toBe('true')
    expect(getSetting('a.json')).toBe('{"role":"ADMIN"}')
  })
})

describe('getSettingNumber', () => {
  it('parses a finite numeric string', () => {
    remember('reconciliation.volume_gap_tolerance_percent')
    upsertSetting('reconciliation.volume_gap_tolerance_percent', '2.5')
    expect(getSettingNumber('reconciliation.volume_gap_tolerance_percent')).toBe(2.5)
  })

  it('parses integers without forcing a float', () => {
    remember('audit.retention_years')
    upsertSetting('audit.retention_years', '7')
    expect(getSettingNumber('audit.retention_years')).toBe(7)
  })

  it('returns null when the setting is absent (caller must choose its fallback)', () => {
    expect(getSettingNumber('missing.key')).toBeNull()
  })

  it('returns null when the setting is an empty string (not NaN)', () => {
    remember('empty.key')
    upsertSetting('empty.key', '')
    expect(getSettingNumber('empty.key')).toBeNull()
  })

  it('returns null when the value is not a finite number', () => {
    remember('garbage.key')
    upsertSetting('garbage.key', 'abc')
    expect(getSettingNumber('garbage.key')).toBeNull()
  })
})

describe('getSettingFunctions', () => {
  it('parses a JSON-array setting into a string array', () => {
    remember('mfa.enforced_for_roles')
    upsertSetting('mfa.enforced_for_roles', '["ADMIN","SUPERADMIN","SUPERVISOR"]')
    expect(getSettingFunctions('mfa.enforced_for_roles', [])).toEqual([
      'ADMIN',
      'SUPERADMIN',
      'SUPERVISOR',
    ])
  })

  it('returns the fallback when the setting is absent', () => {
    expect(getSettingFunctions('missing', ['DEFAULT'])).toEqual(['DEFAULT'])
  })

  it('returns the fallback when the setting is unparseable JSON', () => {
    remember('broken')
    upsertSetting('broken', 'not json {')
    expect(getSettingFunctions('broken', ['FALLBACK'])).toEqual(['FALLBACK'])
  })

  it('returns the fallback when the JSON parses to a non-array', () => {
    remember('object.value')
    upsertSetting('object.value', '{"role": "ADMIN"}')
    expect(getSettingFunctions('object.value', ['FB'])).toEqual(['FB'])
  })

  it('coerces every entry to a string (defends against number/boolean inside the array)', () => {
    remember('mixed')
    upsertSetting('mixed', '[1, "TWO", true]')
    expect(getSettingFunctions('mixed', [])).toEqual(['1', 'TWO', 'true'])
  })

  it('returns an empty array when the setting is an empty array literal', () => {
    remember('empty.list')
    upsertSetting('empty.list', '[]')
    expect(getSettingFunctions('empty.list', ['FB'])).toEqual([])
  })

  it('returns the fallback when the setting is the empty string', () => {
    remember('blank')
    upsertSetting('blank', '')
    expect(getSettingFunctions('blank', ['FB'])).toEqual(['FB'])
  })
})

describe('settings-driven invariant (cross-helper)', () => {
  it('never silently substitutes a default for a missing key — callers must opt in', () => {
    // The helpers themselves never invent a value. If a key is missing, both
    // numeric and array helpers return null / fallback. This guards against
    // any future change that "helpfully" embeds a default in getSettingNumber.
    remember('mfa.cross')
    upsertSetting('mfa.cross', '["ADMIN"]')
    expect(getSettingNumber('mfa.cross')).toBeNull() // wrong type, do not coerce
    expect(getSetting('not.set')).toBeNull()
  })
})
