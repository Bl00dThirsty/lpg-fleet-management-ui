import { createFileRoute } from '@tanstack/react-router'


import { AuditLogsPage } from '@/features/audit-logs'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/audit-logs/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: AuditLogsPage,


})