import { createApiAdapter } from './http-adapter.ts'
import { createApi } from './api.ts'

export type { ApiAdapter, AuthResult, AuthUser, Credentials, ListResponse, ListResult, ApiPagination } from './adapter.ts'
export { createHttpAdapter, createApiAdapter } from './http-adapter.ts'
export { createApi } from './api.ts'

/** Mode-aware singleton adapter (fake | mock | dev/production). */
export const apiAdapter = createApiAdapter()

/** Default app-wide API client bound to the mode-aware adapter. */
export const api = createApi(apiAdapter)
