import { createFileRoute } from '@tanstack/react-router'
import { TrucksPage } from '@/features/trucks'

export const Route = createFileRoute('/_authenticated/trucks/')({
  component: TrucksPage,
})
