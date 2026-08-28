import { createFileRoute } from '@tanstack/react-router'


import { RfidTagsPage } from '@/features/rfid-tags'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





export const Route = createFileRoute('/_authenticated/rfid-tags/')({


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: RfidTagsPage,


})