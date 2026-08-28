import { z } from 'zod'
import type { FieldConfig } from './field-config'

/** A zod object rule per field `name`, used by react-hook-form resolvers. */
export type FieldValuesSchema = z.ZodObject<Record<string, z.ZodTypeAny>>

/**
 * Build a zod object schema from a declarative `FieldConfig[]` (see
 * `field-config.ts`). Each field maps to a rule: required string fields are
 * `min(1)`, email/url validate format, numbers are coerced from strings,
 * switches are booleans and checklists are arrays of strings. Optional
 * string fields accept an empty string (untouched form inputs).
 */
export function zodSchemaFromFields(fields: FieldConfig[]): FieldValuesSchema {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const f of fields) {
    let rule: z.ZodTypeAny
    switch (f.type) {
      case 'email':
        rule = z.string().email('Email invalide')
        break
      case 'url':
        rule = z.string().url('URL invalide')
        break
      case 'number': {
        // Coerce strings from inputs, but keep an untouched/empty input as
        // `undefined` (instead of coercing '' to 0) so the field's `transform`
        // can map it back to null and required numbers actually fail.
        let num = z.coerce.number({ message: 'Valeur numérique requise' })
        if (f.min !== undefined) num = num.min(f.min, `Doit être ≥ ${f.min}`)
        if (f.max !== undefined) num = num.max(f.max, `Doit être ≤ ${f.max}`)
        if (f.positive) num = num.positive('Doit être positif')
        rule = z.preprocess((v) => (v === '' || v == null ? undefined : v), f.required ? num : num.optional())
        break
      }
      case 'switch':
        rule = z.boolean()
        break
      case 'checklist':
        rule = z.array(z.string())
        break
      case 'date': {
        let date = z.string()
        if (f.minDate) {
          date = date.refine((v) => !v || v >= f.minDate!, `Doit être ≥ ${f.minDate}`)
        }
        if (f.maxDate) {
          date = date.refine((v) => !v || v <= f.maxDate!, `Doit être ≤ ${f.maxDate}`)
        }
        rule = date
        break
      }
      case 'select': {
        let select = z.string()
        if (f.options && f.options.length > 0) {
          const values = f.options.map((o) => o.value)
          select = select.refine((v) => v === '' || values.includes(v), 'Valeur non valide')
        }
        rule = select
        break
      }
      case 'file':
        rule = z.string()
        break
      default:
        rule = z.string()
    }

    if (f.pattern && (f.type === 'text' || f.type === 'email')) {
      rule = (rule as z.ZodString).regex(new RegExp(f.pattern), f.patternMessage ?? 'Format invalide')
    }

    const isStringish = f.type !== 'number' && f.type !== 'switch'
    if (f.required && isStringish) {
      rule = (rule as z.ZodString | z.ZodArray<z.ZodString>).min(1, 'Champ requis')
    } else if (!f.required && isStringish) {
      rule = rule.optional()
      if (f.type === 'email' || f.type === 'url') {
        rule = z.union([rule, z.literal('')])
      }
    }

    shape[f.name] = rule
  }
  return z.object(shape)
}
