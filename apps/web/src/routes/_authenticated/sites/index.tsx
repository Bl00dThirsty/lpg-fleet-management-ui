import { createFileRoute } from '@tanstack/react-router'


import { SitesScreen } from '@/features/sites'


import { useAuthStore } from '@/store/auth-store'


import type { SiteRole } from '@/features/sites/lib/site-status-machine'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





function SitesRouteComponent() {


  const role = useAuthStore((s) => s.user?.system_role) as SiteRole | undefined


  return <SitesScreen kind='site' role={role ?? 'MARKETEUR'} />


}





export const Route = createFileRoute('/_authenticated/sites/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: SitesRouteComponent,


})