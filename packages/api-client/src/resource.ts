import type { ApiAdapter, ListResult } from './adapter.ts'

export function createResourceService<T extends { id: string }>(adapter: ApiAdapter, name: string) {
  return {
    list(params?: Record<string, string | number | boolean>): Promise<ListResult<T>> {
      const qs = params
        ? '?' +
          Object.entries(params)
            .filter(([, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
            .join('&')
        : ''
      return adapter.requestList<T>(`/${encodeURIComponent(name)}${qs}`)
    },
    getById(id: string): Promise<T> {
      return adapter.request<T>(`/${encodeURIComponent(name)}/${encodeURIComponent(id)}`)
    },
    create(body: Omit<T, 'id'>): Promise<T> {
      return adapter.request<T>(`/${encodeURIComponent(name)}`, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
    },
    patch(id: string, body: Partial<T>): Promise<T> {
      return adapter.request<T>(`/${encodeURIComponent(name)}/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
    },
    remove(id: string): Promise<void> {
      return adapter.request<void>(`/${encodeURIComponent(name)}/${encodeURIComponent(id)}`, { method: 'DELETE' })
    },
  }
}