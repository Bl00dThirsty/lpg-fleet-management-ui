import { describe, expect, it } from 'vitest'
import type { QueryClient } from '@tanstack/react-query'
import { QUERY_KEYS, invalidateResource } from './invalidation'

describe('QUERY_KEYS', () => {
  it('covers the documented API resources', () => {
    for (const r of ['vehicles', 'tours', 'pickups', 'declarations', 'sites', 'users', 'anomalies', 'risks', 'reports']) {
      expect(Array.isArray(QUERY_KEYS[r])).toBe(true)
    }
  })
})

describe('invalidateResource', () => {
  it('invalidates the resource query key', () => {
    let called: unknown
    const qc = {
      invalidateQueries: (o: unknown) => {
        called = o
      },
    } as unknown as QueryClient
    invalidateResource(qc, 'tours')
    expect(called).toEqual({ queryKey: ['tours'] })
  })
})
