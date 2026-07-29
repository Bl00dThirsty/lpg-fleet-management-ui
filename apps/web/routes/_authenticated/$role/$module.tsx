import { createFileRoute } from '@tanstack/react-router'
import { ModuleScreen } from '@/module/module-screen'
import { roleFromSlug } from '@/config/rbac/sidebar-by-role'
import { getCustomScreen } from '@/module/custom-screens'
import type { Role } from '@lpg/permissions'

export const Route = createFileRoute('/_authenticated/$role/$module')({
  component: ModuleWrapper,
})

function CustomRouteScreen({ role, module }: { role: Role; module: string }) {
  const Custom = getCustomScreen(role, module)
  // eslint-disable-next-line react-hooks/static-components -- components are pre-defined in registry, not created dynamically
  if (Custom) return <Custom />
  return <ModuleScreen role={role} module={module} />
}

function ModuleWrapper() {
  const { role, module } = Route.useParams()
  const resolved = roleFromSlug(role)
  if (!resolved) {
    return (
      <main id='main-content' className='flex-1 p-6'>
        <p className='text-sm text-muted-foreground'>Rôle inconnu : {role}</p>
      </main>
    )
  }
  return <CustomRouteScreen role={resolved} module={module} />
}
