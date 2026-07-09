import { createFileRoute } from '@tanstack/react-router'
import { SuiviTourneesLayout } from '@/features/activite/suivi-tournees/components/suivi-tournees-layout'

export const Route = createFileRoute('/_authenticated/activite/suivi-tournees')({
  component: SuiviTourneesPage,
})

function SuiviTourneesPage() {
  return (
    <div className='flex flex-col h-full bg-background'>
      <div className='flex items-center justify-between px-4 py-3 sm:px-6'>
        <h1 className='text-xl font-bold tracking-tight'>Suivi de mes tournées</h1>
      </div>
      <SuiviTourneesLayout />
    </div>
  )
}
