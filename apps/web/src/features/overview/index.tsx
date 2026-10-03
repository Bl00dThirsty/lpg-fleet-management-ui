import { useMemo } from 'react'
import { CalendarRange, LayoutDashboard } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Main } from '@/components/layout/main'
import { ROLE_LABELS } from '@/config/rbac/roles'
import { useRoleStore } from '@/store/role-store'
import { getOverviewCards } from './data/overview'
import { OverviewKpis } from './components/overview-kpis'
import { OverviewIndicators } from './components/overview-indicators'
import { OverviewQuickLinks } from './components/overview-quick-links'
import type { Role } from '@/config/rbac/roles'
import type { DashboardView } from '@/features/dashboard/data/dashboard'

export function OverviewPage({
  role,
  dashboard,
}: {
  role?: Role
  dashboard?: DashboardView
}) {
  const storeRole = useRoleStore((s) => s.activeRole)
  const activeRole = role ?? storeRole
  const cards = useMemo(
    () => getOverviewCards(activeRole, dashboard),
    [activeRole, dashboard]
  )
  const roleLabel = ROLE_LABELS[activeRole] ?? activeRole

  return (
    <Main fluid className='space-y-6 bg-muted/20'>
      <section className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center gap-3'>
            <div className='flex size-10 items-center justify-center rounded-xl border bg-muted/30'>
              <LayoutDashboard className='size-5 text-primary' />
            </div>
            <h1 className='font-manrope text-3xl font-semibold tracking-tight'>
              Vue d&apos;ensemble
            </h1>
          </div>
          <p className='max-w-3xl text-sm text-muted-foreground sm:text-base'>
            Indicateurs clés consolidés pour votre rôle.
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          {dashboard ? (
            <Button
              type='button'
              variant='outline'
              className='h-10 rounded-xl bg-background shadow-none'
            >
              <CalendarRange className='size-4' />
              {dashboard.overview.dateRangeLabel}
            </Button>
          ) : null}
          <Badge
            variant='outline'
            className='w-fit rounded-xl border-transparent bg-muted/40 px-3 py-2 text-foreground'
          >
            {roleLabel}
          </Badge>
        </div>
      </section>

      {dashboard ? <OverviewKpis dashboard={dashboard} /> : null}

      <section className='space-y-4'>
        <div className='space-y-1'>
          <h2 className='text-lg font-semibold tracking-tight'>
            Indicateurs clés
          </h2>
          <p className='text-sm text-muted-foreground'>
            Lecture consolidée de vos données, accès direct au détail.
          </p>
        </div>
        <OverviewIndicators cards={cards} />
      </section>

      <OverviewQuickLinks role={activeRole} />
    </Main>
  )
}
