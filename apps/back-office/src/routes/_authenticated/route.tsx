import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const saved = localStorage.getItem('lpg-mock-session');
    if (!saved) {
      throw redirect({
        to: '/login',
      });
    }
  },
  component: AuthenticatedLayout,
})
