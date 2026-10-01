import type { OrgType, Role } from '@lpg/types'

export interface AuthUser {
  id: string
  email: string
  first_name: string
  last_name: string
  system_role: Role
  org_id?: string
  org_name?: string
  org_type?: OrgType
  site_ids?: string[]
  mfa_status?: string
}

export interface AuthResult {
  access_token: string
  refresh_token: string
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

export interface ListResult<T> {
  data: T[]
  pagination: ApiPagination
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: string
  headers?: Record<string, string>
}

export interface ApiAdapter {
  request<T>(path: string, init?: RequestOptions): Promise<T>
  requestList<T>(path: string, init?: RequestOptions): Promise<ListResult<T>>
  login(creds: Credentials): Promise<AuthResult>
  refresh(refresh_token: string): Promise<AuthResult>
  setAccessTokenGetter(getter: () => string | null): void
  setOnUnauthorized(handler: () => void): void
}