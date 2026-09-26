import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleServerError } from './handle-server-error'

const toastError = vi.hoisted(() => vi.fn())
const tMock = vi.hoisted(() => vi.fn())

vi.mock('sonner', () => ({
  toast: {
    error: toastError,
  },
}))

vi.mock('@/lib/i18n', () => ({
  // The function under test calls `i18n.t(key, { defaultValue })`. i18next's
  // contract is: when the key resolves, return the translation; otherwise
  // return `defaultValue`. Mock it that way so the test mirrors the real
  // library semantics without depending on the active locale.
  default: {
    t: (key: string, opts?: { defaultValue?: string }) => {
      tMock(key, opts)
      return translations[key] ?? opts?.defaultValue ?? key
    },
  },
}))

// Hand-crafted translation table — covers exactly the keys
// `handle-server-error.ts` reaches for. Adding a new key here forces the test
// to think about the FR/EN string, not just rely on the defaultValue.
const translations: Record<string, string> = {
  'errors:server.generic': 'Une erreur serveur est survenue',
  'errors:server.noContent': 'Aucun contenu.',
}

beforeEach(() => {
  vi.mocked(toastError).mockClear()
  tMock.mockClear()
})

describe('handleServerError', () => {
  it('shows the localized server message when the error is not recognised', () => {
    handleServerError(new Error('network'))

    expect(toastError).toHaveBeenCalledWith('Une erreur serveur est survenue')
  })

  it('maps a plain object with status 204 to the no-content message', () => {
    handleServerError({ status: 204 })

    expect(toastError).toHaveBeenCalledWith('Aucun contenu.')
  })

  it('prefers the API title when the error is an Axios error with response data', () => {
    const error = new AxiosError('Bad request')
    error.response = {
      status: 422,
      data: { title: 'Validation failed' },
    } as AxiosError['response']

    handleServerError(error)

    expect(toastError).toHaveBeenCalledWith('Validation failed')
  })

  it('falls back to the localized server message when Axios response has no data.title', () => {
    const error = new AxiosError('Request failed')
    error.response = {
      status: 500,
      data: {},
    } as AxiosError['response']

    handleServerError(error)

    expect(toastError).toHaveBeenCalledWith('Une erreur serveur est survenue')
  })

  it('falls back to the localized server message when Axios data.title is an empty string', () => {
    const error = new AxiosError('Bad request')
    error.response = {
      status: 400,
      data: { title: '' },
    } as AxiosError['response']

    handleServerError(error)

    expect(toastError).toHaveBeenCalledWith('Une erreur serveur est survenue')
  })

  it('logs the error to the console in development', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const err = new Error('logged')

    handleServerError(err)

    expect(log).toHaveBeenCalledTimes(1)
    expect(log).toHaveBeenCalledWith(err)

    log.mockRestore()
  })

  it('does not log the error to the console in production', () => {
    vi.stubEnv('DEV', false)

    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const err = new Error('not logged')

    handleServerError(err)

    expect(log).not.toHaveBeenCalled()

    log.mockRestore()
  })
})
