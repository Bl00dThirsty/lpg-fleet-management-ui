import { describe, expect, it } from 'vitest'
import { extractErrorMessage } from './use-toast-feedback'

describe('extractErrorMessage', () => {
  it('returns a thrown message', () => {
    expect(extractErrorMessage(new Error('Transition interdite'))).toBe(
      'Transition interdite',
    )
  })

  it('falls back for unknown errors', () => {
    expect(extractErrorMessage(undefined)).toBe('Une erreur est survenue. Réessayez.')
    expect(extractErrorMessage({ code: 123 })).toBe(
      'Une erreur est survenue. Réessayez.',
    )
  })

  it('maps an axios-like 403 to the French access-denied message', () => {
    const fakeAxiosError = {
      isAxiosError: true,
      message: 'Request failed with status code 403',
      response: { status: 403, data: {} },
    }
    expect(extractErrorMessage(fakeAxiosError)).toBe('Accès refusé.')
  })

  it('maps an axios-like 409 to the French conflict message', () => {
    const fakeAxiosError = {
      isAxiosError: true,
      message: 'Request failed with status code 409',
      response: { status: 409, data: { title: 'Le enregistrement a été modifié' } },
    }
    expect(extractErrorMessage(fakeAxiosError)).toBe('Le enregistrement a été modifié')
  })

  it('still surfaces a plain error message before the network fallback', () => {
    expect(extractErrorMessage(new Error('Transition interdite'))).toBe(
      'Transition interdite',
    )
  })
})
