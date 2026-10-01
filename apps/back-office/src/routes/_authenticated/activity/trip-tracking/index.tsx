import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { TripsPage } from '@/features/activity/trip-tracking/components/trips-page'
import { tripStatusOptions, cargoTypeOptions } from '@/features/activity/trip-tracking/data/trip-data'

const tripsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  q: z.string().optional().catch(''),
  status: z
    .array(
      z.enum(
        tripStatusOptions.map((status) => status.value) as [
          (typeof tripStatusOptions)[number]['value'],
          ...(typeof tripStatusOptions)[number]['value'][],
        ]
      )
    )
    .optional()
    .catch([]),
  type: z
    .array(
      z.enum(
        cargoTypeOptions.map((type) => type.value) as [
          (typeof cargoTypeOptions)[number]['value'],
          ...(typeof cargoTypeOptions)[number]['value'][],
        ]
      )
    )
    .optional()
    .catch([]),
})

export const Route = createFileRoute('/_authenticated/activity/trip-tracking/')({
  validateSearch: tripsSearchSchema,
  component: TripsPage,
})
