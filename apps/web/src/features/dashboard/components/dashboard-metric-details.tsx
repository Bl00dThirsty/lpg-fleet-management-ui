import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { DashboardAlertList } from './dashboard-alert-list'
import { DashboardCarrierSummary } from './dashboard-carrier-summary'
import { DashboardRouteTable } from './dashboard-route-table'
import type {
  DashboardAlert,
  DashboardDetailId,
  DashboardFleetSummary,
  DashboardRouteContribution,
} from '../data/dashboard'

function detailsCopy(
  t: (key: string) => string,
  activeMetricId: DashboardDetailId,
) {
  return {
    title: t(`details.${activeMetricId}.title`),
    description: t(`details.${activeMetricId}.description`),
    badge: t(`details.${activeMetricId}.badge`),
  }
}

export function DashboardMetricDetails({
  activeMetricId,
  routeContributions,
  fleets,
  alerts,
}: {
  activeMetricId: DashboardDetailId
  routeContributions: DashboardRouteContribution[]
  fleets: DashboardFleetSummary[]
  alerts: DashboardAlert[]
}) {
  const { t } = useTranslation('dashboard')
  const copy = detailsCopy(t, activeMetricId)

  return (
    <Card className='rounded-2xl border-border/60 shadow-none'>
      <CardHeader className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='space-y-1'>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </div>
        <Badge
          variant='outline'
          className='w-fit border-transparent bg-muted/40 text-foreground'
        >
          {copy.badge}
        </Badge>
      </CardHeader>
      <CardContent>
        {activeMetricId === 'alerts' ? (
          <DashboardAlertList alerts={alerts} />
        ) : (
          <div className='grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]'>
            <DashboardCarrierSummary fleets={fleets} />
            <DashboardRouteTable
              contributions={routeContributions}
              mode={activeMetricId}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
