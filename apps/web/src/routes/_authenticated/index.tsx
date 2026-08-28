import { createFileRoute, redirect } from '@tanstack/react-router'


import { useRoleStore } from '@/store/role-store'


import { landingPathFor } from '@/config/rbac/sidebar-by-role'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/')({


  beforeLoad: () => {


    const role = useRoleStore.getState().activeRole


    throw redirect({ to: landingPathFor(role) })


  },


  pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
})


