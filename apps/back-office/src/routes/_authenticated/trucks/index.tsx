import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { TrucksPage } from '@/features/trucks'
import {
  contractTierOptions,
  truckStatusOptions,
} from '@/features/trucks/data/trucks'

const trucksSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  q: z.string().optional().catch(''),
  status: z
    .array(
      z.enum(
        truckStatusOptions.map((status) => status.value) as [
          (typeof truckStatusOptions)[number]['value'],
          ...(typeof truckStatusOptions)[number]['value'][],
        ]
      )
    )
    .optional()
    .catch([]),
  company: z.array(z.string()).optional().catch([]),
  site: z.array(z.string()).optional().catch([]),
  contract: z
    .array(
      z.enum(
        contractTierOptions.map((contract) => contract.value) as [
          (typeof contractTierOptions)[number]['value'],
          ...(typeof contractTierOptions)[number]['value'][],
        ]
      )
    )
    .optional()
    .catch([]),
})

export const Route = createFileRoute('/_authenticated/trucks/')({
  validateSearch: trucksSearchSchema,
  component: TrucksPage,
})
