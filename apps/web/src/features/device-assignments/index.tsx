import { getRouteApi } from '@tanstack/react-router'
import { RadioTower } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCallback, useState } from 'react'
import { DeviceAssignmentsTable } from './components/device-assignments-table'
import { DeviceAssignmentDetailsSheet } from './components/device-assignment-details-sheet'
import { getDeviceAssignments } from './data/device-assignments'
import type { DeviceAssignmentView } from './data/device-assignments'

const route = getRouteApi('/_authenticated/device-assignments/')

export function DeviceAssignmentsPage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [detailsAssignment, setDetailsAssignment] = useState<DeviceAssignmentView | null>(null)
  const assignments = getDeviceAssignments()

  const handleViewDetails = useCallback((assignment: DeviceAssignmentView) => {
    setDetailsAssignment(assignment)
  }, [])

  return (
    <main
      id='main-content'
      className='flex-1 space-y-4 bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 sm:p-6 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900'
    >
      <section className='rounded-2xl border-transparent bg-background/88 p-3 shadow-sm backdrop-blur-sm sm:p-4'>
        <div className='flex flex-wrap items-center gap-2'>
          <RadioTower className='h-6 w-6 text-primary' />
          <h1 className='text-2xl font-bold tracking-tight'>Affectations appareils</h1>
          <Badge variant='outline' className='ml-auto'>
            {assignments.length}
          </Badge>
        </div>
      </section>

      <section className='space-y-4 rounded-xl border-transparent bg-background/92 p-4 shadow-sm'>
        <DeviceAssignmentsTable
          data={assignments}
          search={search}
          navigate={navigate}
          onViewDetails={handleViewDetails}
        />
      </section>

      <DeviceAssignmentDetailsSheet
        assignment={detailsAssignment}
        open={detailsAssignment !== null}
        onOpenChange={(open) => {
          if (!open) setDetailsAssignment(null)
        }}
      />
    </main>
  )
}