import { seeds, fakeProfiles } from '@lpg/mock-data'
import type { ApiAdapter, AuthResult, Credentials, ListResult } from './adapter.ts'

/**
 * In-browser fake backend. No network, no server: data comes from bundled seed
 * fixtures and login just selects a demo profile by email (password ignored).
 * This is the mode used on static hosts (Vercel) where the Express mock server
 * cannot run. Swap to a real backend = set VITE_API_MODE to dev/production.
 */

function paginate<T>(items: T[], page = 1, limit = 20): ListResult<T> {
  const safePage = Math.max(1, page)
  const safeLimit = Math.min(100, Math.max(1, limit))
  const start = (safePage - 1) * safeLimit
  const total = items.length
  return {
    data: items.slice(start, start + safeLimit),
    pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) },
  }
}

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function fakeToken(profileId: string): string {
  return `fake.${profileId}.${Date.now()}`
}

export function createFakeAdapter(): ApiAdapter {
  return {
    async request<T>(path: string): Promise<T> {
      const match = path.match(/^\/([a-z-]+)(?:\/([^?]+))?/i)
      const name = match?.[1]
      const id = match?.[2]
      if (name && id && seeds[name as keyof typeof seeds]) {
        const item = (seeds[name as keyof typeof seeds] as any[]).find((x) => x.id === id)
        if (!item) throw new Error('Introuvable')
        return delay(item) as Promise<T>
      }
      if (name === 'me') {
        return delay(null as unknown as T)
      }
      throw new Error(`Fake adapter: unsupported path ${path}`)
    },

    async requestList<T>(path: string): Promise<ListResult<T>> {
      const match = path.match(/^\/([a-z-]+)/i)
      const name = match?.[1]
      if (!name || !seeds[name as keyof typeof seeds]) {
        throw new Error(`Fake adapter: unknown resource ${name}`)
      }
      const params = new URLSearchParams(path.includes('?') ? path.slice(path.indexOf('?') + 1) : '')
      const page = Number(params.get('page') ?? 1)
      const limit = Number(params.get('limit') ?? params.get('limite') ?? 20)
      return delay(paginate(seeds[name as keyof typeof seeds] as T[], page, limit))
    },

    async login(creds: Credentials): Promise<AuthResult> {
      const profile = fakeProfiles.find((p) => p.email === creds.email) ?? fakeProfiles[0]
      return delay({
        accessToken: fakeToken(profile.id),
        refreshToken: fakeToken(profile.id),
        user: { ...profile },
      })
    },

    async refresh(): Promise<AuthResult> {
      throw new Error('Fake adapter: refresh not supported')
    },

    setAccessTokenGetter(): void {},
    setOnUnauthorized(): void {},
  }
}

/** App-wide singleton fake adapter (browser-only backend). */
export const fakeAdapter = createFakeAdapter()
