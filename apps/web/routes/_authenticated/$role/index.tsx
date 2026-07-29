import { createFileRoute } from '@tanstack/react-router'
import { RoleDashboard } from '@/module/role-dashboard'
import { roleFromSlug } from '@/config/rbac/sidebar-by-role'

export const Route = createFileRoute('/_authenticated/$role/')({
  component: RoleDashboardWrapper,
})

function RoleDashboardWrapper() {
  const { role } = Route.useParams()
  const resolved = roleFromSlug(role)
  if (!resolved) {
    return (
      <main id='main-content' className='flex-1 p-6'>
        <p className='text-sm text-muted-foreground'>Rôle inconnu : {role}</p>
      </main>
    )
  }
  return <RoleDashboard role={resolved} />
}
