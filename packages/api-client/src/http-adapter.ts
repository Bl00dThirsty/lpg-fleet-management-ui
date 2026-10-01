import axios, { type AxiosInstance } from 'axios'
import type { ApiEnvelope } from '@lpg/types'
import type { ApiAdapter, ApiPagination, AuthResult, Credentials, ListResult, RequestOptions } from './adapter.ts'
import { fakeAdapter } from './fake-adapter.ts'

type AccessTokenGetter = () => string | null
type UnauthorizedHandler = () => void

function resolveBaseURL(override?: string): string {
  if (override) return override
  const mode = (import.meta as any).env?.VITE_API_MODE
  if (mode === 'mock' || !mode) return 'http://localhost:8787/api/v1'
  return (import.meta as any).env?.VITE_API_BASE_URL ?? '/api/v1'
}

export function createHttpAdapter(baseURL?: string): ApiAdapter {
  const client: AxiosInstance = axios.create({
    baseURL: resolveBaseURL(baseURL ?? (import.meta as any).env?.VITE_API_BASE_URL),
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

  async function request<T>(path: string, init?: RequestOptions): Promise<T> {
    const res = await client.request<ApiEnvelope<T>>({
      url: path,
      method: (init?.method as any) ?? 'GET',
      data: init?.body,
      headers: init?.headers,
    })
    if (!res.data.success) throw new Error(res.data.message || 'Request failed')
    return res.data.data as T
  }

  async function requestList<T>(path: string, init?: RequestOptions): Promise<ListResult<T>> {
    const res = await client.request<ApiEnvelope<T[]>>({
      url: path,
      method: (init?.method as any) ?? 'GET',
      data: init?.body,
      headers: init?.headers,
    })
    if (!res.data.success) throw new Error(res.data.message || 'Request failed')
    return {
      data: (res.data.data as T[]) ?? [],
      pagination: res.data.pagination ?? ({ page: 1, limit: 0, total: 0, pages: 0 } as ApiPagination),
    }
  }

  return {
    request,
    requestList,
    async login(creds: Credentials): Promise<AuthResult> {
      const res = await client.post<ApiEnvelope<AuthResult>>('/auth/login', creds)
      if (!res.data.success) throw new Error(res.data.message)
      return res.data.data as AuthResult
    },
    async refresh(refresh_token: string): Promise<AuthResult> {
      const res = await client.post<ApiEnvelope<AuthResult>>('/auth/refresh', { refresh_token })
      if (!res.data.success) throw new Error(res.data.message)
      return res.data.data as AuthResult
    },
    setAccessTokenGetter(getter) { getAccessToken = getter },
    setOnUnauthorized(handler) { onUnauthorized = handler },
  }
}

export function createApiAdapter(): ApiAdapter {
  const mode = (import.meta as any).env?.VITE_API_MODE
  if (mode === 'fake') return fakeAdapter
  return createHttpAdapter()
}