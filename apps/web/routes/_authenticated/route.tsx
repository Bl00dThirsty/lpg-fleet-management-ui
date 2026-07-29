import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/store/auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { accessToken, hydrateSession } = useAuthStore.getState()
    if (!accessToken) {
      await hydrateSession()
    }
    const token = useAuthStore.getState().accessToken
    if (!token) {
      throw redirect({
        to: '/login',
      })
    }
  },
  component: AuthenticatedLayout,
})
