/**
 * Settings-driven business rules (AGENTS.md §4).
 *
 * Thumb rule: no hardcoded business thresholds in code. Every tunable value
 * (geo confidence, battery alerts, SLA timeouts, tolerances, retention years,
 * MFA enforcement, …) is read by `setting_key` from the `settings` fixture
 * (`seed/curated/10_system_config.json`), mirroring the production `settings`
 * table. Consumers that need a numeric threshold use `getSettingNumber`.
 */

import { curated } from './curated.ts'

export function getSetting(key: string): string | null {
  const setting = curated.settings.find((s) => s.setting_key === key)
  const value = setting?.setting_value
  return typeof value === 'string' ? value : value === undefined || value === null ? null : String(value)
}

export function getSettingNumber(key: string): number | null {
  const raw = getSetting(key)
  if (raw === null || raw === '') return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * JSON-array business rule stored as a `setting_value` string, mirroring the
 * `mfa.enforced_for_roles` pattern (e.g. `["ADMIN","SUPERADMIN"]`). Returns the
 * parsed array, or `fallback` when the setting is absent / unparseable. Purely
 * string-typed on disk, like every other setting.
 */
export function getSettingFunctions(key: string, fallback: string[]): string[] {
  const raw = getSetting(key)
  if (raw === null || raw === '') return fallback
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.map(String)
  } catch {
    /* fall through */
  }
  return fallback
}