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
  defaultValue: string
}

export const settingCategoryLabels: Record<string, string> = {
  GEO: 'Géolocalisation',
  DEVICE: 'Dispositifs',
  COMPLIANCE: 'Conformité',
  TOURNEE: 'Tournées',
  AUDIT: 'Audit',
  SECURITY: 'Sécurité',
  GPS: 'GPS',
  REPORT: 'Rapports',
  RESERVE: 'Réserve',
  FLUX1: 'Flux 1 (enlèvements)',
}

function getDefaultValue(setting: Setting): string {
  return String(setting.setting_value)
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
    defaultValue: getDefaultValue(setting),
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