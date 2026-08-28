import type { LanguagePreference } from '@/store/preferences-store'
import type { ZodErrorMap } from 'zod'

export function getZodErrorMap(lang: LanguagePreference): ZodErrorMap {
  return ((issue: any, ctx: any) => {
    const fr = lang === 'fr-FR'
    const isUndefined =
      issue.received === 'undefined' || (issue.code === 'invalid_type' && issue.input === undefined)
    if (issue.code === 'invalid_type' && isUndefined) return { message: fr ? 'Champ requis' : 'Required' }
    if (issue.code === 'too_small') return { message: fr ? `Minimum ${issue.minimum}` : `Minimum ${issue.minimum}` }
    if (
      (issue.code === 'invalid_string' && issue.validation === 'email') ||
      (issue.code === 'invalid_format' && issue.format === 'email')
    )
      return { message: fr ? 'Email invalide' : 'Invalid email' }
    if (
      (issue.code === 'invalid_string' && issue.validation === 'url') ||
      (issue.code === 'invalid_format' && issue.format === 'url')
    )
      return { message: fr ? 'URL invalide' : 'Invalid URL' }
    return { message: ctx?.defaultError ?? issue.message ?? '' }
  }) as unknown as ZodErrorMap
}
