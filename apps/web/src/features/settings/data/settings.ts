import { settings } from '@lpg/mock-data'
import type { Setting } from '@lpg/types'

export type { Setting }

export interface SettingView {
  id: string
  key: string
  value: string
  valueType: 'NUMBER' | 'BOOLEAN' | 'JSON' | 'STRING'
  category: string
  categoryLabel: string
  description: string
  isEncrypted: boolean
  requiresRestart: boolean
  minValue: number | null
  maxValue: number | null
  defaultValue: string | null
  titleKey: string
  descriptionKey: string
  searchText?: string
}

export type SettingValidationError = {
  field: 'value'
  code: 'required' | 'number' | 'min' | 'max' | 'boolean' | 'json'
}

export type SettingFilters = {
  query: string
  category: string
  valueType: string
}

export type SettingRestorePlan = {
  affectedCount: number
  values: Readonly<Record<string, string>>
}

export const settingCategoryLabels: Record<string, string> = {
  GEO: 'Geolocation',
  DEVICE: 'Devices',
  COMPLIANCE: 'Compliance',
  TOURNEE: 'Tours',
  AUDIT: 'Audit',
  SECURITY: 'Security',
  GPS: 'GPS',
  REPORT: 'Reports',
  RESERVE: 'Reserve',
  FLUX1: 'Flow 1 (pickups)',
}

export const settingTitleKeys: Record<string, string> = {
  'geo.confidence_auto_verify_threshold': 'settings.keys.geoConfidenceAutoVerifyThreshold',
  'geo.confidence_flag_threshold': 'settings.keys.geoConfidenceFlagThreshold',
  'device.battery_critical_threshold': 'settings.keys.deviceBatteryCriticalThreshold',
  'device.offline_alert_minutes': 'settings.keys.deviceOfflineAlertMinutes',
  'reconciliation.volume_gap_tolerance_percent':
    'settings.keys.reconciliationVolumeGapTolerancePercent',
  'tournee.transporter_ack_timeout_hours': 'settings.keys.tourneeTransporterAckTimeoutHours',
  'tournee.unassigned_alert_hours': 'settings.keys.tourneeUnassignedAlertHours',
  'audit.retention_years': 'settings.keys.auditRetentionYears',
  'mfa.enforced_for_roles': 'settings.keys.mfaEnforcedForRoles',
  'gps.capture_interval_minutes': 'settings.keys.gpsCaptureIntervalMinutes',
  'report.default_expiry_days': 'settings.keys.reportDefaultExpiryDays',
  'reconciliation.subsidy_rate_per_tm': 'settings.keys.reconciliationSubsidyRatePerTm',
  'reserve.critical_fill_percent': 'settings.keys.reserveCriticalFillPercent',
  'flux1.pickup_source_functions': 'settings.keys.flux1PickupSourceFunctions',
}

function getDefaultValue(): string | null {
  return null
}

export function getSettings(): SettingView[] {
  return (settings as Setting[]).map((setting) => ({
    id: setting.id,
    key: setting.setting_key,
    value: String(setting.setting_value),
    valueType: setting.value_type as SettingView['valueType'],
    category: setting.category,
    categoryLabel: settingCategoryLabels[setting.category] ?? setting.category,
    description: setting.description ?? '',
    isEncrypted: setting.is_encrypted,
    requiresRestart: setting.requires_restart,
    minValue: setting.min_value ?? null,
    maxValue: setting.max_value ?? null,
    defaultValue: getDefaultValue(),
    titleKey: settingTitleKeys[setting.setting_key] ?? `settings.keys.${setting.setting_key}`,
    descriptionKey: `${settingTitleKeys[setting.setting_key] ?? `settings.keys.${setting.setting_key}`}.description`,
  }))
}

export function getSettingsByCategory(): Record<string, SettingView[]> {
  const rows = getSettings()
  const grouped: Record<string, SettingView[]> = {}
  for (const row of rows) {
    const key = row.categoryLabel
    grouped[key] = grouped[key] ?? []
    grouped[key].push(row)
  }
  return grouped
}

export function getSettingSummary() {
  const rows = getSettings()
  const categories = new Set(rows.map((r) => r.categoryLabel))
  return {
    total: rows.length,
    encrypted: rows.filter((r) => r.isEncrypted).length,
    categories: categories.size,
  }
}

export function getSettingById(id: string): SettingView | undefined {
  return getSettings().find((s) => s.id === id)
}

export function getSettingByKey(key: string): SettingView | undefined {
  return getSettings().find((s) => s.key === key)
}

export function getSettingSearchText(setting: SettingView, localizedTitle: string): string {
  return [
    localizedTitle,
    setting.key,
    setting.description,
    setting.category,
    setting.valueType,
    setting.isEncrypted ? 'encrypted' : setting.value,
  ]
    .join(' ')
    .toLocaleLowerCase()
}

export function filterSettings(
  rows: SettingView[],
  filters: SettingFilters,
): SettingView[] {
  const query = filters.query.trim().toLocaleLowerCase()
  return rows.filter((row) => {
    const matchesQuery = !query || getSettingSearchText(row, row.titleKey).includes(query)
    const matchesCategory = filters.category === 'ALL' || row.category === filters.category
    const matchesType = filters.valueType === 'ALL' || row.valueType === filters.valueType
    return matchesQuery && matchesCategory && matchesType
  })
}

export function validateSettingValue(
  setting: SettingView,
  value: string,
): SettingValidationError | null {
  if (!value) return { field: 'value', code: 'required' }
  if (setting.valueType === 'NUMBER') {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) return { field: 'value', code: 'number' }
    if (setting.minValue !== null && parsed < setting.minValue) {
      return { field: 'value', code: 'min' }
    }
    if (setting.maxValue !== null && parsed > setting.maxValue) {
      return { field: 'value', code: 'max' }
    }
  }
  if (setting.valueType === 'BOOLEAN' && value !== 'true' && value !== 'false') {
    return { field: 'value', code: 'boolean' }
  }
  if (setting.valueType === 'JSON') {
    try {
      JSON.parse(value)
    } catch {
      return { field: 'value', code: 'json' }
    }
  }
  return null
}

export function isSettingDirty(setting: SettingView, value: string): boolean {
  return setting.value !== value
}

export function captureSettingSnapshot(
  rows: SettingView[],
): Readonly<Record<string, string>> {
  return Object.freeze(Object.fromEntries(rows.map((row) => [row.id, row.value])))
}

export function getSettingRestorePlan(
  snapshot: Readonly<Record<string, string>>,
  rows: SettingView[],
): SettingRestorePlan {
  const values = Object.fromEntries(
    rows
      .filter((row) => snapshot[row.id] !== undefined && snapshot[row.id] !== row.value)
      .map((row) => [row.id, snapshot[row.id] as string]),
  )
  return { affectedCount: Object.keys(values).length, values: Object.freeze(values) }
}