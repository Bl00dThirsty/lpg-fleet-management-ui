import axios, { type AxiosInstance } from 'axios'
import type { ApiEnvelope } from '@lpg/types'
import type { ApiAdapter, AuthResult, Credentials } from './adapter.ts'
import { fakeAdapter } from './fake-adapter.ts'

type AccessTokenGetter = () => string | null
type UnauthorizedHandler = () => void

/**
 * Derive the backend base URL from the active API mode. Only the base URL
 * differs between environments; the same adapter/handlers are used everywhere.
 *  - mock:        local @lpg/mock-api Express server (CORS-enabled)
 *  - dev:         real backend dev URL (override with VITE_API_BASE_URL)
 *  - production:  same as dev unless VITE_API_BASE_URL is provided
 */
function resolveBaseURL(override?: string): string {
  if (override) return override
  const mode = import.meta.env.VITE_API_MODE
  // Unset (plain `turbo run dev`) defaults to the local mock server so the
  // app works out-of-the-box. dev/production use a relative /api base (proxied).
  if (mode === 'mock' || !mode) return 'http://localhost:8787/api/v1'
  return import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
}

/**
 * HTTP implementation of {@link ApiAdapter}. Used for every environment
 * (`mock` | `dev` | `production`); only the base URL changes. Handles bearer
 * token attachment and a single silent refresh on 401 before retrying.
 */
export function createHttpAdapter(baseURL?: string): ApiAdapter {
  const client: AxiosInstance = axios.create({
    baseURL: resolveBaseURL(baseURL ?? import.meta.env.VITE_API_BASE_URL),
    timeout: 20_000,
  })

  let getAccessToken: AccessTokenGetter = () => null
  let onUnauthorized: UnauthorizedHandler = () => {}
  let isRefreshing = false

  client.interceptors.request.use((config) => {
    const token = getAccessToken()
    if (token) {
      config.headers = config.headers ?? {}
      ;(config.headers as Record<string, string>).Authorization = `Bearer ${token}`
    }
    return config
  })

  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config
      if (error.response?.status === 401 && !original._retry) {
        original._retry = true
        if (!isRefreshing) {
          isRefreshing = true
          try {
            await onUnauthorized()
          } finally {
            isRefreshing = false
          }
        }
        const token = getAccessToken()
        if (token) {
          original.headers = original.headers ?? {}
          original.headers.Authorization = `Bearer ${token}`
          return client(original)
        }
      }
      return Promise.reject(error)
    }
  )

  async function request<T>(path: string, init?: { method?: string; body?: string; headers?: Record<string, string> }): Promise<T> {
    const res = await client.request<ApiEnvelope<T>>({
      url: path,
      method: (init?.method as any) ?? 'GET',
      data: init?.body,
      headers: init?.headers,
    })
    if (!res.data.success) {
      throw new Error(res.data.message || 'Request failed')
    }
    return res.data.donnees
  }

  async function requestList<T>(
    path: string,
    init?: { method?: string; body?: string; headers?: Record<string, string> },
  ): Promise<{ data: T[]; pagination: import('./adapter.ts').ApiPagination }> {
    const res = await client.request<ApiEnvelope<T[]>>({
      url: path,
      method: (init?.method as any) ?? 'GET',
      data: init?.body,
      headers: init?.headers,
    })
    if (!res.data.success) {
      throw new Error(res.data.message || 'Request failed')
    }
    return {
      data: res.data.donnees ?? [],
      pagination: res.data.pagination ?? { page: 1, limit: 0, total: 0, pages: 0 },
    }
  }

  return {
    request,
    requestList,
    async login(creds: Credentials): Promise<AuthResult> {
      const res = await client.post<ApiEnvelope<AuthResult>>('/auth/login', creds)
      if (!res.data.success) throw new Error(res.data.message)
      return res.data.donnees
    },
    async refresh(refreshToken: string): Promise<AuthResult> {
      const res = await client.post<ApiEnvelope<AuthResult>>('/auth/refresh', { refreshToken })
      if (!res.data.success) throw new Error(res.data.message)
      return res.data.donnees
    },
    setAccessTokenGetter(getter) {
      getAccessToken = getter
    },
    setOnUnauthorized(handler) {
      onUnauthorized = handler
    },
  }
}

/** App-wide singleton adapter. */
export const apiAdapter = createHttpAdapter()

/**
 * Mode-aware adapter selection. The same UI/feature code runs against any
 * backend — only the adapter changes:
 *  - fake:        in-browser fixture data, no server (used on static hosts like Vercel)
 *  - mock:        local Express mock server at http://localhost:8787/api/v1 (local dev)
 *  - dev/production: real backend at VITE_API_BASE_URL (default /api/v1)
 */
export function createApiAdapter(): ApiAdapter {
  const mode = import.meta.env.VITE_API_MODE
  if (mode === 'fake') {
    return fakeAdapter
  }
  return createHttpAdapter()
}
