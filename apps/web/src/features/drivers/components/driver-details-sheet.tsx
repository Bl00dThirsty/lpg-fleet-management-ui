import { CalendarDays, CarFront, Route, UserRound, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  driverStatusClasses,
  driverStatusLabels,
  type DriverView,
} from '../data/drivers'

type DriverDetailsSheetProps = {
  driver: DriverView | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DriverDetailsSheet({
  driver,
  open,
  onOpenChange,
}: DriverDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {driver ? (
        <SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
          <SheetHeader className='pb-4'>
            <div className='flex items-start justify-between gap-3 pe-8'>
              <div>
                <SheetTitle className='text-xl'>{driver.full_name}</SheetTitle>
                <SheetDescription>
                  Permis {driver.license_number} — {driver.org_name}
                </SheetDescription>
              </div>
              <Badge
                className={cn(
                  'font-medium',
                  driverStatusClasses[
                    driver.is_active ? 'ACTIVE' : 'INACTIVE'
                  ]
                )}
              >
                {driverStatusLabels[driver.is_active ? 'ACTIVE' : 'INACTIVE']}
              </Badge>
            </div>
          </SheetHeader>

          <div className='space-y-4 px-4 pb-6'>
            <div className='grid grid-cols-2 gap-3'>
              <MetricCard
                icon={CarFront}
                label='Vehicules affectes'
                value={String(driver.assigned_vehicle_count)}
              />
              <MetricCard
                icon={Route}
                label='Tournees actives'
                value={String(driver.active_tour_count)}
              />
              <MetricCard
                icon={Wrench}
                label='Total tournees'
                value={String(driver.total_tour_count)}
              />
              <MetricCard
                icon={CalendarDays}
                label='Derniere activite'
                value={driver.last_activity ? formatDateTime(driver.last_activity) : '—'}
              />
            </div>

            <Card className='border-transparent bg-muted/20 shadow-xs'>
              <CardHeader className='pb-2'>
                <CardTitle className='flex items-center gap-2 text-sm'>
                  <UserRound className='size-4 text-primary' />
                  Identite
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <DetailLine label='Nom complet' value={driver.full_name} />
                <DetailLine label='Prenom' value={driver.first_name} />
                <DetailLine label='Nom' value={driver.last_name} />
                <DetailLine label='Permis' value={driver.license_number} />
              </CardContent>
            </Card>

            <Card className='border-transparent bg-muted/20 shadow-xs'>
              <CardHeader className='pb-2'>
                <CardTitle className='flex items-center gap-2 text-sm'>
                  <Route className='size-4 text-primary' />
                  Affectation
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <DetailLine label='Entreprise' value={driver.org_name} />
                <DetailLine
                  label='Vehicules affectes'
                  value={String(driver.assigned_vehicle_count)}
                />
                <DetailLine
                  label='Tournees actives'
                  value={String(driver.active_tour_count)}
                />
                <DetailLine
                  label='Tournees totales'
                  value={String(driver.total_tour_count)}
                />
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      ) : null}
    </Sheet>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className='rounded-lg bg-muted/25 p-3 shadow-xs'>
      <p className='flex items-center gap-1.5 text-xs text-muted-foreground'>
        <Icon className='size-3.5 text-primary' />
        {label}
      </p>
      <p className='mt-1 text-lg leading-none font-semibold'>{value}</p>
    </div>
  )
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-start justify-between gap-3 text-sm'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='max-w-72 text-right font-medium'>{value}</span>
    </div>
  )
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}