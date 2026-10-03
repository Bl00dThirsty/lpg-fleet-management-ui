import { createFileRoute, redirect } from '@tanstack/react-router'


import { landingPathFor } from '@/config/rbac/sidebar-by-role'


import { LivreursPage } from '@/features/livreurs'


import { hasPermission } from '@lpg/permissions'


import { useRoleStore } from '@/store/role-store'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/livreurs/')({


  beforeLoad: () => {


    const role = useRoleStore.getState().activeRole


    if (!hasPermission(role, 'livreurs.read')) {


      throw redirect({ to: landingPathFor(role) })


    }


  },


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: LivreursPage,


})


