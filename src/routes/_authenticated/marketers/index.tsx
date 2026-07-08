import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { MarketersPage } from '@/features/marketers'
import { marketerStatusOptions } from '@/features/marketers/data/marketers'

const marketersSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  q: z.string().optional().catch(''),
  status: z
    .array(
      z.enum(
        marketerStatusOptions.map((status) => status.value) as [
          (typeof marketerStatusOptions)[number]['value'],
          ...(typeof marketerStatusOptions)[number]['value'][],
        ]
      )
    )
    .optional()
    .catch([]),
})

export const Route = createFileRoute('/_authenticated/marketers/')({
  validateSearch: marketersSearchSchema,
  component: MarketersPage,
})
