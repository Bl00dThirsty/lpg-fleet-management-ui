import z from 'zod'


import { createFileRoute } from '@tanstack/react-router'


import { TrucksPage } from '@/features/trucks'


import { tourneeStatusOptions } from '@/config/field-options'
import { RouteSkeleton } from '@/components/layout/route-skeleton'
import { GeneralError } from '@/features/errors/general-error'





const trucksSearchSchema = z.object({


  page: z.number().optional().catch(1),


  pageSize: z.number().optional().catch(10),


  q: z.string().optional().catch(''),


  status: z


    .array(


      z.enum(


        tourneeStatusOptions.map((status) => status.value) as [


          (typeof tourneeStatusOptions)[number]['value'],


          ...(typeof tourneeStatusOptions)[number]['value'][],


        ]


      )


    )


    .optional()


    .catch([]),


  company: z.array(z.string()).optional().catch([]),


  site: z.array(z.string()).optional().catch([]),


})





export const Route = createFileRoute('/_authenticated/trucks/')({


  validateSearch: trucksSearchSchema,


    pendingComponent: RouteSkeleton,
  errorComponent: GeneralError,
component: TrucksPage,


})


