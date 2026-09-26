import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  extractErrorMessage,
  isAuthPolicyError,
  isHandledMutationMeta,
  runMutation,
  shouldShowGlobalMutationError,
} from './use-toast-feedback'

const toastError = vi.hoisted(() => vi.fn())
const toastSuccess = vi.hoisted(() => vi.fn())

vi.mock('sonner', () => ({
  toast: {
    error: toastError,
    success: toastSuccess,
  },
}))

beforeEach(() => {
  toastError.mockClear()
  toastSuccess.mockClear()
})

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
    expect(extractErrorMessage(fakeAxiosError)).toBe(
      'Conflit avec l’état actuel des données.',
    )
  })

  it('still surfaces a plain error message before the network fallback', () => {
    expect(extractErrorMessage(new Error('Transition interdite'))).toBe(
      'Transition interdite',
    )
  })

  it('maps auth and HTTP statuses before an Axios title', () => {
    expect(
      extractErrorMessage({
        isAxiosError: true,
        message: 'Request failed with status code 401',
        response: { status: 401, data: { title: 'Server title' } },
      }),
    ).toBe('Session expirée. Veuillez vous reconnecter.')
    expect(
      extractErrorMessage({
        isAxiosError: true,
        message: 'Request failed with status code 403',
        response: { status: 403, data: { title: 'Server title' } },
      }),
    ).toBe('Accès refusé.')
  })

  it('maps network TypeErrors before their raw message', () => {
    expect(extractErrorMessage(new TypeError('Failed to fetch'))).toBe(
      'Réseau indisponible.',
    )
  })
})

describe('mutation feedback', () => {
  it('recognizes handled mutation metadata', () => {
    expect(isHandledMutationMeta({ handled: true })).toBe(true)
    expect(isHandledMutationMeta({ handled: false })).toBe(false)
    expect(isHandledMutationMeta(undefined)).toBe(false)
  })

  it('returns a discriminated success result after showing one success toast', async () => {
    await expect(runMutation(async () => 'saved', 'Enregistré.')).resolves.toEqual({
      ok: true,
      data: 'saved',
    })

    expect(toastSuccess).toHaveBeenCalledOnce()
    expect(toastSuccess).toHaveBeenCalledWith('Enregistré.')
    expect(toastError).not.toHaveBeenCalled()
  })

  it('returns a discriminated failure result after showing one error toast', async () => {
    await expect(
      runMutation(async () => {
        throw new Error('Transition interdite')
      }, 'Enregistré.'),
    ).resolves.toEqual({ ok: false })

    expect(toastError).toHaveBeenCalledOnce()
    expect(toastError).toHaveBeenCalledWith('Transition interdite')
    expect(toastSuccess).not.toHaveBeenCalled()
  })

  it('rethrows auth policy errors without a local toast', async () => {
    for (const status of [401, 403]) {
      const error = {
        isAxiosError: true,
        message: 'Request failed',
        response: { status, data: {} },
      }

      await expect(runMutation(async () => Promise.reject(error))).rejects.toBe(error)
      expect(isAuthPolicyError(error)).toBe(true)
    }
    expect(toastError).not.toHaveBeenCalled()
  })

  it('applies global toast policy from MutationFunctionContext metadata', () => {
    const error = new Error('server failure')

    expect(
      shouldShowGlobalMutationError(
        error,
        undefined,
        undefined,
        { meta: { handled: true } },
      ),
    ).toBe(false)
    expect(
      shouldShowGlobalMutationError(error, undefined, undefined, { meta: undefined }),
    ).toBe(true)
    expect(
      shouldShowGlobalMutationError(
        { isAxiosError: true, response: { status: 304, data: {} } },
        undefined,
        undefined,
        { meta: undefined },
      ),
    ).toBe(false)
  })
})
