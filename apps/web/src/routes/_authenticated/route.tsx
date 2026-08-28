import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/store/auth-store'
import { type Role } from '@/config/rbac/roles'
import { canAccessPath, deniedPathRedirect } from '@/config/rbac/route-access'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const { accessToken, hydrateSession } = useAuthStore.getState()
    if (!accessToken) {
      await hydrateSession()
    }
    const auth = useAuthStore.getState()
    const token = auth.accessToken
    if (!token) {
      throw redirect({
        to: '/login',
      })
    }
    // Defense-in-depth: nav visibility alone must not guarantee access.
    // Store the denied-redirect target in the route context for the component
    // to render an alert dialog before navigating.
    const role = auth.user?.system_role as Role | undefined
    if (role && !canAccessPath(role, location.pathname)) {
      return { deniedTo: deniedPathRedirect(role, location.pathname) }
    }
    return { deniedTo: null }
  },
  component: AuthenticatedRouteGuard,
})

function AuthenticatedRouteGuard() {
  const { deniedTo } = Route.useRouteContext()
  const navigate = useNavigate()

  if (deniedTo) {
    return (
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accès refusé</AlertDialogTitle>
            <AlertDialogDescription>
              Vous n'avez pas la permission d'accéder à cette page. Redirection
              vers l'aperçu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => navigate({ to: deniedTo })}
            >
              Continuer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return <AuthenticatedLayout />
}
