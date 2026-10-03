import { createApiAdapter } from './http-adapter.ts'
import { createApi } from './api.ts'

export type { ApiAdapter, AuthResult, AuthUser, Credentials, ListResult, ApiPagination, RequestOptions } from './adapter.ts'
export { createHttpAdapter, createApiAdapter } from './http-adapter.ts'
export { createApi } from './api.ts'

export const apiAdapter = createApiAdapter()
export const api = createApi(apiAdapter)