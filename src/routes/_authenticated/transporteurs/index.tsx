import { createFileRoute } from '@tanstack/react-router'
import { TransporteursPage } from '@/features/transporteurs'

export const Route = createFileRoute('/_authenticated/transporteurs/')({
  component: TransporteursPage,
})
