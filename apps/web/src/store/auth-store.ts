import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, apiAdapter } from '@lpg/api-client'
import type { AuthUser, AuthResult } from '@lpg/api-client'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  status: 'idle' | 'authenticating' | 'authenticated' | 'unauthenticated'
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hydrateSession: () => Promise<void>
  updateProfile: (patch: Partial<Pick<AuthUser, 'first_name' | 'last_name' | 'email'>>) => void
}

// Bridge the adapter to the stored access token so HTTP requests carry the bearer.
apiAdapter.setAccessTokenGetter(() => useAuthStore.getState().accessToken)
apiAdapter.setOnUnauthorized(() => useAuthStore.getState().logout())

async function applyAuthResult(result: AuthResult) {
  useAuthStore.setState({
    user: result.user,
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
    status: 'authenticated',
  })
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      status: 'idle',

      async login(email, password) {
        set({ status: 'authenticating' })
        try {
          const result = await api.auth.login({ email, password })
          await applyAuthResult(result)
        } catch (err) {
          set({ status: 'unauthenticated' })
          throw err
        }
      },

      logout() {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          status: 'unauthenticated',
        })
      },

      async hydrateSession() {
        const { refreshToken, status } = useAuthStore.getState()
        if (!refreshToken || status === 'authenticated') return
        try {
          const result = await api.auth.refresh(refreshToken)
          await applyAuthResult(result)
        } catch {
          set({ status: 'unauthenticated' })
        }
      },

      updateProfile(patch) {
        const { user } = useAuthStore.getState()
        if (!user) return
        set({ user: { ...user, ...patch } })
      },
    }),
    {
      name: 'lpg-auth',
      // Persist only the session identity, never the credentials. Access and
      // refresh tokens live in memory for the duration of the session; they
      // must not survive in localStorage where any script on the origin
      // (or an XSS) could read them. Token refresh-on-reload is out of scope
      // for the mock adapter — the user re-authenticates via the demo login.
      partialize: (state) => ({
        user: state.user,
        status: state.status,
      }),
    },
  ),
)
