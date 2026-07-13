import { createFileRoute } from '@tanstack/react-router'
import { TransportersPage } from '@/features/transporters'

export const Route = createFileRoute('/_authenticated/transporters/')({
  component: TransportersPage,
})
