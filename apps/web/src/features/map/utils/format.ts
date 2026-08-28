import { currentLang, formatNumber, formatNumberWithOptions } from '@/lib/i18n/formatters'
import type { LanguagePreference } from '@/store/preferences-store'

/** @deprecated Use formatTM from @/lib/i18n/formatters directly */
export function formatTm(value: number, lang: LanguagePreference = currentLang()): string {
  if (!Number.isFinite(value)) return '—'
  return `${formatNumberWithOptions(Math.round(value * 10) / 10, lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} TM`
}

/** @deprecated Use formatBtl from @/lib/i18n/formatters directly */
export function formatBtl(value: number, lang: LanguagePreference = currentLang()): string {
  if (!Number.isFinite(value)) return '—'
  return `${formatNumber(Math.round(value), lang)} btl`
}

export function formatPercent(value: number, _lang: LanguagePreference = currentLang()): string {
  if (!Number.isFinite(value)) return '—'
  return `${Math.round(value)} %`
}
