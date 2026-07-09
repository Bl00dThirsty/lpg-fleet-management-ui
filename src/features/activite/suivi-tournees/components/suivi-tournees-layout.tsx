import * as React from 'react'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { tournees } from '../data/tournee-data'
import { TourneeDetails } from './tournee-details'
import { TourneeList } from './tournee-list'

export function SuiviTourneesLayout() {
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [selectedTourneeId, setSelectedTourneeId] = React.useState<string | null>(tournees[0].id)
  
  const selectedTournee = tournees.find((tournee) => tournee.id === selectedTourneeId) ?? tournees[0]

  function handleSelectTournee(tourneeId: string) {
    setSelectedTourneeId(tourneeId)

    // On mobile screens (< 1024px in this context, matching lg breakpoint), open the sheet
    if (window.innerWidth < 1024) {
      setDetailsOpen(true)
    }
  }

  return (
    <>
      <div
        className='grid h-[calc(100vh-var(--header-height,64px))] overflow-hidden lg:grid-cols-[400px_minmax(0,1fr)] lg:divide-x border-t'
      >
        <div className='h-full overflow-hidden bg-muted/10'>
          <TourneeList
            tournees={tournees}
            selectedTourneeId={selectedTourneeId}
            onSelectTournee={handleSelectTournee}
          />
        </div>
        <div className='hidden h-full overflow-hidden lg:block bg-background'>
          <TourneeDetails tournee={selectedTournee} />
        </div>
      </div>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent
          side='right'
          className='w-full gap-0 p-0 sm:max-w-none md:w-3/4'
        >
          <SheetHeader className='sr-only'>
            <SheetTitle>{selectedTournee ? `Tournée ${selectedTournee.id}` : 'Détails de la tournée'}</SheetTitle>
            <SheetDescription>Détails de la tournée sélectionnée et suivi du trajet.</SheetDescription>
          </SheetHeader>
          <TourneeDetails tournee={selectedTournee} />
        </SheetContent>
      </Sheet>
    </>
  )
}
