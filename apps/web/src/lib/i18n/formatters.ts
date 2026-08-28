import { format as dfnFormat } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import type { LanguagePreference } from '@/store/preferences-store'

export function getDateFnsLocale(lang: LanguagePreference) {
  return lang === 'en-US' ? enUS : fr
}

export function currentLang(): LanguagePreference {
  try {
    if (typeof document !== 'undefined' && document.documentElement.lang) {
      const dl = document.documentElement.lang
      if (dl === 'en' || dl === 'en-US') return 'en-US'
      if (dl === 'fr' || dl === 'fr-FR') return 'fr-FR'
    }
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('lpg-user-preferences')
      if (raw) {
        const parsed = JSON.parse(raw) as { state?: { language?: LanguagePreference } }
        if (parsed.state?.language) return parsed.state.language
      }
    }
  } catch {
    // ignore
  }
  return 'fr-FR'
}

const numCache = new Map<string, Intl.NumberFormat>()
function numFmt(lang: LanguagePreference, opts?: Intl.NumberFormatOptions) {
  const key = `${lang}:${JSON.stringify(opts)}`
  if (!numCache.has(key)) numCache.set(key, new Intl.NumberFormat(lang, opts))
  return numCache.get(key)!
}

export const formatNumber = (n: number, lang: LanguagePreference) => numFmt(lang).format(n)
export const formatNumberWithOptions = (n: number, lang: LanguagePreference, opts: Intl.NumberFormatOptions) =>
  numFmt(lang, opts).format(n)
export const formatTM = (n: number, lang: LanguagePreference) => `${numFmt(lang).format(n)} TM`
export const formatBtl = (n: number, lang: LanguagePreference) => `${numFmt(lang).format(n)} btl`
export const formatXAF = (n: number, lang: LanguagePreference) => `${numFmt(lang).format(Math.round(n))} XAF`
export const formatPercent = (n: number, lang: LanguagePreference) =>
  `${numFmt(lang, { maximumFractionDigits: 1 }).format(n)} %`
export function formatDate(date: Date, lang: LanguagePreference, fmt = 'dd MMM yyyy') {
  return dfnFormat(date, fmt, { locale: getDateFnsLocale(lang) })
}
export function formatDateTime(date: Date, lang: LanguagePreference) {
  return new Intl.DateTimeFormat(lang, { dateStyle: 'short', timeStyle: 'medium' }).format(date)
}
