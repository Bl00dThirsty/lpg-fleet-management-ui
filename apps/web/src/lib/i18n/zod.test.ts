import { describe, expect, it } from 'vitest'
import { getZodErrorMap } from './zod'

function getMessage(map: ReturnType<typeof getZodErrorMap>, issue: any): string {
  const res = (map as unknown as (a: any, b: any) => any)(issue, { defaultError: 'x', data: undefined })
  if (typeof res === 'string') return res
  return res?.message ?? ''
}

describe('getZodErrorMap', () => {
  it('returns French for invalid_type undefined', () => {
    const map = getZodErrorMap('fr-FR')
    const issue = { code: 'invalid_type', expected: 'string', received: 'undefined' } as any
    expect(getMessage(map, issue)).toBe('Champ requis')
  })
  it('returns English for invalid_type undefined', () => {
    const map = getZodErrorMap('en-US')
    const issue = { code: 'invalid_type', expected: 'string', received: 'undefined' } as any
    expect(getMessage(map, issue)).toBe('Required')
  })
  it('returns French for invalid email', () => {
    const map = getZodErrorMap('fr-FR')
    const issue = { code: 'invalid_string', validation: 'email' } as any
    expect(getMessage(map, issue)).toBe('Email invalide')
  })
  it('returns English for invalid email', () => {
    const map = getZodErrorMap('en-US')
    const issue = { code: 'invalid_string', validation: 'email' } as any
    expect(getMessage(map, issue)).toBe('Invalid email')
  })
  it('returns French for too_small', () => {
    const map = getZodErrorMap('fr-FR')
    const issue = { code: 'too_small', minimum: 3, type: 'string', inclusive: true } as any
    expect(getMessage(map, issue)).toBe('Minimum 3')
  })
  it('returns English for too_small', () => {
    const map = getZodErrorMap('en-US')
    const issue = { code: 'too_small', minimum: 5, type: 'string', inclusive: true } as any
    expect(getMessage(map, issue)).toBe('Minimum 5')
  })
})
