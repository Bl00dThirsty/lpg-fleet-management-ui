import z from 'zod'


import { createFileRoute } from '@tanstack/react-router'


import { VehiclesPage } from '@/features/vehicles'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





const vehiclesSearchSchema = z.object({


  q: z.string().optional().catch(''),


})





export const Route = createFileRoute('/_authenticated/vehicles/')({


  validateSearch: vehiclesSearchSchema,


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: VehiclesPage,


})