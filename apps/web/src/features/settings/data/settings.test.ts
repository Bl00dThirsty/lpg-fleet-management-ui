import { describe, expect, it } from 'vitest'
import * as settingsModule from './settings'
import {
  getSettings,
  getSettingsByCategory,
  getSettingSummary,
  type SettingView,
} from './settings'

const setting = (overrides: Partial<SettingView> = {}): SettingView => ({
  id: 'setting-1',
  key: 'geo.confidence_auto_verify_threshold',
  value: '80',
  valueType: 'NUMBER',
  category: 'GEO',
  categoryLabel: 'Geolocation',
  description: 'Confidence threshold',
  isEncrypted: false,
  requiresRestart: false,
  minValue: 0,
  maxValue: 100,
  defaultValue: null,
  titleKey: 'settings.keys.geoConfidenceAutoVerifyThreshold',
  descriptionKey: 'settings.keys.geoConfidenceAutoVerifyThreshold.description',
  ...overrides,
})

describe('settings view-model', () => {
  it('maps settings with category labels', () => {
    const rows = getSettings()
    expect(rows.length).toBeGreaterThanOrEqual(8)
    for (const row of rows) {
      expect(row.key).toBeTruthy()
      expect(row.categoryLabel).toBeTruthy()
      expect(typeof row.value).toBe('string')
    }
  })

  it('groups settings by category', () => {
    const grouped = getSettingsByCategory()
    const total = Object.values(grouped).reduce((acc, list) => acc + list.length, 0)
    expect(total).toBe(getSettings().length)
    expect(Object.keys(grouped).length).toBeGreaterThanOrEqual(3)
  })

  it('computes summary', () => {
    const summary = getSettingSummary()
    expect(summary.total).toBe(getSettings().length)
    expect(summary.categories).toBeGreaterThanOrEqual(3)
  })

  it('never exposes an encrypted value to search', () => {
    const getSearchText = (settingsModule as typeof settingsModule & {
      getSettingSearchText?: (row: SettingView, localizedTitle: string) => string
    }).getSettingSearchText
    expect(getSearchText).toBeTypeOf('function')
    const encrypted = setting({ value: 'top-secret-value', isEncrypted: true })
    expect(getSearchText?.(encrypted, 'Auto verification threshold')).not.toContain(
      'top-secret-value',
    )
    expect(getSearchText?.(encrypted, 'Auto verification threshold')).toContain(
      'auto verification threshold',
    )
  })

  it('filters by search text, category, and value type', () => {
    const filterSettings = (settingsModule as typeof settingsModule & {
      filterSettings?: (
        rows: SettingView[],
        filters: { query: string; category: string; valueType: string },
      ) => SettingView[]
    }).filterSettings
    expect(filterSettings).toBeTypeOf('function')
    const rows = [
      setting({ id: '1', searchText: 'Geo confidence threshold' }),
      setting({
        id: '2',
        key: 'mfa.enforced_for_roles',
        category: 'SECURITY',
        categoryLabel: 'Security',
        valueType: 'JSON',
        searchText: 'MFA roles',
      }),
    ]
    expect(filterSettings?.(rows, { query: 'mfa', category: 'ALL', valueType: 'ALL' })).toEqual([
      rows[1],
    ])
    expect(filterSettings?.(rows, { query: '', category: 'GEO', valueType: 'JSON' })).toEqual([])
  })

  it('validates number bounds, exact booleans, and JSON syntax', () => {
    const validateSettingValue = (settingsModule as typeof settingsModule & {
      validateSettingValue?: (row: SettingView, value: string) => { code: string } | null
    }).validateSettingValue
    expect(validateSettingValue).toBeTypeOf('function')
    expect(validateSettingValue?.(setting(), '101')?.code).toBe('max')
    expect(
      validateSettingValue?.(
        setting({ valueType: 'BOOLEAN', minValue: null, maxValue: null }),
        'TRUE',
      )?.code,
    ).toBe('boolean')
    expect(
      validateSettingValue?.(
        setting({ valueType: 'JSON', minValue: null, maxValue: null }),
        '{broken',
      )?.code,
    ).toBe('json')
    expect(validateSettingValue?.(setting(), '80')).toBeNull()
  })

  it('detects dirty values and plans only changed snapshot restores', () => {
    const settingsHelpers = settingsModule as typeof settingsModule & {
      isSettingDirty?: (row: SettingView, value: string) => boolean
      captureSettingSnapshot?: (rows: SettingView[]) => Readonly<Record<string, string>>
      getSettingRestorePlan?: (
        snapshot: Readonly<Record<string, string>>,
        rows: SettingView[],
      ) => { affectedCount: number; values: Readonly<Record<string, string>> }
    }
    expect(settingsHelpers.isSettingDirty).toBeTypeOf('function')
    expect(settingsHelpers.captureSettingSnapshot).toBeTypeOf('function')
    expect(settingsHelpers.getSettingRestorePlan).toBeTypeOf('function')
    const initial = [setting({ id: '1', value: '80' }), setting({ id: '2', value: 'false' })]
    const snapshot = settingsHelpers.captureSettingSnapshot?.(initial) ?? {}
    const current = [setting({ id: '1', value: '90' }), setting({ id: '2', value: 'false' })]
    const plan = settingsHelpers.getSettingRestorePlan?.(snapshot, current)
    expect(settingsHelpers.isSettingDirty?.(initial[0] as SettingView, '80')).toBe(false)
    expect(settingsHelpers.isSettingDirty?.(initial[0] as SettingView, '90')).toBe(true)
    expect(plan).toEqual({ affectedCount: 1, values: { '1': '80' } })
    expect(initial[0]?.value).toBe('80')
  })
})