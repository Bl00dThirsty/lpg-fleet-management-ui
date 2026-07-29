import type { Role } from '@lpg/types'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
}

export interface AuthResult {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface Credentials {
  email: string
  password: string
}

export interface ApiPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface ListResponse<T> {
  data: T[]
  pagination: ApiPagination
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: string
  headers?: Record<string, string>
}

/** A paginated list payload, normalized for the UI layer. */
export interface ListResult<T> {
  data: T[]
  pagination: ApiPagination
}

/** The single seam between the app and any backend (mock or real). */
export interface ApiAdapter {
  request<T>(path: string, init?: RequestOptions): Promise<T>
  requestList<T>(path: string, init?: RequestOptions): Promise<ListResult<T>>
  login(creds: Credentials): Promise<AuthResult>
  refresh(refreshToken: string): Promise<AuthResult>
  setAccessTokenGetter(getter: () => string | null): void
  setOnUnauthorized(handler: () => void): void
}
