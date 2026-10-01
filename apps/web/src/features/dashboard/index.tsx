import { useMemo, useState } from 'react'
import { ArrowDownToLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type Role } from '@/config/rbac/roles'
import { Main } from '@/components/layout/main'
import { useAuthStore } from '@/store/auth-store'
import { useRoleStore } from '@/store/role-store'
import { buildDashboardView } from './data/dashboard'
import { LpgKpiStrip } from './components/lpg-kpi-strip'
import { LpgDeliveryFlow } from './components/lpg-delivery-flow'
import { RegionalTraceabilityQuality } from './components/regional-traceability-quality'
import { RegionalVolumeCadence } from './components/regional-volume-cadence'
import { DateRangePicker, type DateRangeValue } from '@/components/date-range-picker'
import { subDays } from 'date-fns'

export function DashboardPage({ role }: { role?: Role } = {}) {
  const user = useAuthStore((s) => s.user)
  const activeRole = useRoleStore((s) => s.activeRole)
  const effectiveRole = role ?? activeRole ?? (user?.system_role as Role) ?? 'SUPERADMIN'

  const [dateRange, setDateRange] = useState<DateRangeValue>({
    from: subDays(new Date(), 27),
    to: new Date(),
  })

  // Préservation intégrale des liaisons backend et de l'hydratation des données
  const dashboard = useMemo(
    () => buildDashboardView(effectiveRole, user?.org_id, user?.org_name),
    [effectiveRole, user?.org_id, user?.org_name]
  )

  const heading =
    effectiveRole === 'SUPERADMIN'
      ? 'Pilotage National — Traçabilité Hors Réseau'
      : effectiveRole === 'ADMIN'
        ? 'Tableau de Bord Administration'
        : effectiveRole === 'SUPERVISOR'
          ? 'Supervision des Flux & Traçabilité'
          : effectiveRole === 'MARKETEUR'
            ? 'Pilotage Marketeur — Distribution Hors Réseau'
            : effectiveRole === 'TRANSPORTEUR'
              ? 'Suivi Flotte & Acheminement Entreprises'
              : 'Tableau de Bord Traçabilité GPL'

  const subtitle =
    effectiveRole === 'SUPERADMIN'
      ? 'Suivi exécutif de la traçabilité du gaz hors réseau (Bouteilles 50 kg & Vrac), des tournées et du tracking de la flotte.'
      : effectiveRole === 'MARKETEUR'
        ? 'Suivi des livraisons vrac et bouteilles 50 kg destinées aux entreprises et clients industriels.'
        : effectiveRole === 'TRANSPORTEUR'
          ? 'Tracking en temps réel des camions citernes et plateaux 50 kg en tournée.'
          : 'Vue consolidée et simplifiée de la distribution de GPL hors réseau pour le top management.'

  return (
    <Main fluid className='space-y-6 bg-muted/20 pb-10'>
      {/* En-tête exécutif */}
      <section className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
        <div className='space-y-1'>
          <h1 className='font-manrope text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>
            {heading}
          </h1>
          <p className='max-w-3xl text-xs text-muted-foreground sm:text-sm'>
            {subtitle}
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <DateRangePicker
            value={dateRange}
            onValueChange={setDateRange}
            className='h-9 rounded-lg bg-background text-xs shadow-none'
          />
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-9 rounded-lg bg-background text-xs shadow-none'
          >
            <ArrowDownToLine className='mr-1.5 size-3.5' />
            Exporter
          </Button>
        </div>
      </section>

      {/* Bloc 1 : Bandeau KPI Exécutif (Vrac, 50kg, Tournées, Camions tracés, Conformité) */}
      <section>
        <LpgKpiStrip
          totalDeliveredTM={dashboard.overview.totalDeliveredTM}
          totalTransportedTM={dashboard.overview.totalTransportedTM}
          activeTrips={dashboard.overview.activeTrips}
          activeTrucks={dashboard.overview.activeTrucks}
          totalTrucks={dashboard.overview.totalTrucks}
        />
      </section>

      {/* Bloc 2 : Flux des Livraisons Hors Réseau (Tonnages mensuels & Bons validés) */}
      <section>
        <LpgDeliveryFlow />
      </section>

      {/* Bloc 3 : Qualité de Traçabilité (10 Régions) & Cadence des Volumes Livrés (1 Mois) */}
      <section className='grid grid-cols-1 gap-6 xl:grid-cols-12'>
        <div className='xl:col-span-7'>
          <RegionalTraceabilityQuality />
        </div>
        <div className='xl:col-span-5'>
          <RegionalVolumeCadence />
        </div>
      </section>
    </Main>
  )
}
