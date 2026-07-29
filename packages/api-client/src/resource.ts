import type { ApiAdapter, ListResponse } from './adapter.ts'

export function createResourceService<T extends { id: string }>(adapter: ApiAdapter, name: string) {
  return {
    list(params?: Record<string, string | number>): Promise<ListResponse<T>> {
      const qs = params
        ? '?' +
          Object.entries(params)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
            .join('&')
        : ''
      return adapter.requestList<T>(`/${name}${qs}`)
    },
    getById(id: string): Promise<T> {
      return adapter.request<T>(`/${name}/${id}`)
    },
    create(body: Omit<T, 'id'>): Promise<T> {
      return adapter.request<T>(`/${name}`, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
    },
    update(id: string, body: Partial<T>): Promise<T> {
      return adapter.request<T>(`/${name}/${id}`, { method: 'PUT', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
    },
    patch(id: string, body: Partial<T>): Promise<T> {
      return adapter.request<T>(`/${name}/${id}`, { method: 'PATCH', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
    },
    remove(id: string): Promise<void> {
      return adapter.request<void>(`/${name}/${id}`, { method: 'DELETE' })
    },
  }
}
