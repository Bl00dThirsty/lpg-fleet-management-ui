import { createFileRoute } from '@tanstack/react-router'
import { GeneralLayout } from '@/features/settings/general'

export const Route = createFileRoute('/_authenticated/settings/general')({
  component: GeneralLayout,
})
