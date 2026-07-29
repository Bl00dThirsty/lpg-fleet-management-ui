import { useState } from 'react'
import { ArrowDownToLine, CalendarRange } from 'lucide-react'
import { Button } from '@lpg/ui'
import { PageShell } from '@/components/layout/page'
import { SectionCards } from './section-cards'
import { ChartAreaInteractive } from './chart-area-interactive'
import { ChartBar } from './chart-bar'
import { ChartPie } from './chart-pie'
import { ChartLine } from './chart-line'
import { MultiselectFilter, MultiselectBadges } from './multiselect-filter'
import { RecentActivity } from './recent-activity'

const statusFilterOptions = [
  { value: 'planned', label: 'Planifiee' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminee' },
  { value: 'cancelled', label: 'Annulee' },
]

const fleetFilterOptions = [
  { value: 'available', label: 'Disponible' },
  { value: 'in_transit', label: 'En transit' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'inactive', label: 'Inactif' },
]

export function DashboardPage() {
  const [tourFilters, setTourFilters] = useState<string[]>([])
  const [fleetFilters, setFleetFilters] = useState<string[]>([])

  return (
    <PageShell fluid>
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tableau de bord global</h1>
            <p className="text-sm text-muted-foreground">
              Vue d&apos;ensemble de la flotte et des operations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <ArrowDownToLine className="size-4" />
              Exporter
            </Button>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <CalendarRange className="size-4" />
              Periode
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 py-1">
          <MultiselectFilter
            title="Statut tournees"
            options={statusFilterOptions}
            selected={tourFilters}
            onChange={setTourFilters}
          />
          <MultiselectFilter
            title="Statut flotte"
            options={fleetFilterOptions}
            selected={fleetFilters}
            onChange={setFleetFilters}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <MultiselectBadges
            values={tourFilters}
            options={statusFilterOptions}
            onRemove={(v) => setTourFilters((prev) => prev.filter((f) => f !== v))}
          />
          <MultiselectBadges
            values={fleetFilters}
            options={fleetFilterOptions}
            onRemove={(v) => setFleetFilters((prev) => prev.filter((f) => f !== v))}
          />
        </div>
      </div>

      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />

          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>

          <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
            <ChartBar />
            <ChartPie />
          </div>

          <div className="px-4 lg:px-6">
            <ChartLine />
          </div>

          <div className="px-4 lg:px-6">
            <RecentActivity />
          </div>
        </div>
      </div>
    </PageShell>
  )
}
